import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

const EVO_BASE = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

async function evoFetch(path: string, options: any = {}) {
  const url = EVO_BASE + path;
  const headers = { 'apikey': EVO_KEY, 'Content-Type': 'application/json', ...options.headers };
  const r = await fetch(url, { ...options, headers });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    return { status: r.status, error: text, data: null };
  }
  const data = await r.json().catch(() => null);
  return { status: r.status, data, error: null };
}

function getTenantId(req: Request) {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
}

async function getTenant(tenantId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tenants')
    .select('id, features')
    .eq('id', tenantId)
    .single();
  if (error) {
    const { data: newTenant, error: newError } = await supabase
      .from('tenants')
      .upsert({ id: tenantId, name: 'SaaS Customer', plan: 'free', monthly_limit: 100, status: 'active' }, { onConflict: 'id' })
      .select('id, features')
      .single();
    if (newError) throw newError;
    return newTenant;
  }
  return data;
}

async function saveChips(tenantId: string, chips: any[]) {
  const supabase = getSupabaseAdmin();
  const tenant = await getTenant(tenantId);
  const features = { ...(tenant.features || {}), chips };
  const { error } = await supabase.from('tenants').update({ features }).eq('id', tenantId);
  if (error) throw error;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const tenant = await getTenant(tenantId);
    const savedChips = Array.isArray(tenant.features?.chips) ? tenant.features.chips : [];

    const { data: evoInstances } = await evoFetch('/instance/fetchInstances');
    const instances = Array.isArray(evoInstances) ? evoInstances : [];

    const slots = [];
    for (let i = 1; i <= 5; i++) {
      const instanceName = `b2zap_chip_${i}`;
      const evoInst = instances.find((inst: any) => inst.instanceName === instanceName || inst.name === instanceName);
      const saved = savedChips.find((c: any) => c.slot === i);

      slots.push({
        slot: i,
        name: saved?.name || `Chip Auxiliar ${i}`,
        instanceName,
        status: evoInst ? (evoInst.connectionStatus === 'open' ? 'connected' : 'disconnected') : 'disconnected',
        phone: evoInst?.ownerJid ? evoInst.ownerJid.split('@')[0] : '',
      });
    }

    return NextResponse.json({ data: slots });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar chips' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    const { action, slot, name } = body;
    if (!slot || slot < 1 || slot > 5) {
      return NextResponse.json({ error: 'Slot inválido (deve ser de 1 a 5)' }, { status: 400 });
    }

    const instanceName = `b2zap_chip_${slot}`;
    const tenant = await getTenant(tenantId);
    const chips = Array.isArray(tenant.features?.chips) ? tenant.features.chips : [];

    if (action === 'connect') {
      // First check if instance exists
      const { data: evoInstances } = await evoFetch('/instance/fetchInstances');
      const instances = Array.isArray(evoInstances) ? evoInstances : [];
      const evoInst = instances.find((inst: any) => inst.instanceName === instanceName || inst.name === instanceName);

      if (evoInst) {
        if (evoInst.connectionStatus === 'open') {
          return NextResponse.json({ connected: true, message: 'Já conectado' });
        }
        // Delete instance to regenerate QR Code
        await evoFetch(`/instance/delete/${instanceName}`, { method: 'DELETE' });
      }

      // Create new instance
      const origin = req.nextUrl.origin;
      const webhookUrl = `${origin}/api/evolution/webhook`;

      const { status, data, error } = await evoFetch('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          webhook: {
            url: webhookUrl,
            enabled: true,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'MESSAGES_DELETE',
              'SEND_MESSAGE',
              'CONNECTION_UPDATE'
            ]
          }
        })
      });

      if (status === 201 && data?.qrcode?.base64) {
        // Save chip settings in tenant features
        const existingIdx = chips.findIndex((c: any) => c.slot === slot);
        const updatedChip = { slot, name: name || `Chip Auxiliar ${slot}`, instanceName };
        if (existingIdx !== -1) {
          chips[existingIdx] = updatedChip;
        } else {
          chips.push(updatedChip);
        }
        await saveChips(tenantId, chips);

        return NextResponse.json({ connected: false, qrcode: data.qrcode.base64 });
      }

      return NextResponse.json({ error: 'Falha ao criar instância no Evolution API', details: error || data }, { status: 500 });
    }

    if (action === 'disconnect') {
      await evoFetch(`/instance/delete/${instanceName}`, { method: 'DELETE' });
      // Remove from database config
      const filtered = chips.filter((c: any) => c.slot !== slot);
      await saveChips(tenantId, filtered);
      return NextResponse.json({ success: true, disconnected: true });
    }

    if (action === 'rename') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
      }
      const existingIdx = chips.findIndex((c: any) => c.slot === slot);
      if (existingIdx !== -1) {
        chips[existingIdx].name = name.trim();
      } else {
        chips.push({ slot, name: name.trim(), instanceName });
      }
      await saveChips(tenantId, chips);
      return NextResponse.json({ success: true });
    }

    if (action === 'status') {
      const { data: state } = await evoFetch(`/instance/connectionState/${instanceName}`);
      return NextResponse.json({ state: state?.instance || null });
    }

    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao gerenciar chip' }, { status: 500 });
  }
}
