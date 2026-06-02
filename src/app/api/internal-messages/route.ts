import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

type InternalMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

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

function getInternalMessages(features: any): InternalMessage[] {
  return Array.isArray(features?.internal_messages) ? features.internal_messages : [];
}

async function saveInternalMessages(tenantId: string, messages: InternalMessage[]) {
  const supabase = getSupabaseAdmin();
  const tenant = await getTenant(tenantId);
  const features = { ...(tenant.features || {}), internal_messages: messages };
  const { error } = await supabase.from('tenants').update({ features }).eq('id', tenantId);
  if (error) throw error;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const tenant = await getTenant(tenantId);
    const messages = getInternalMessages(tenant.features);
    return NextResponse.json({ data: messages });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar mensagens' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.senderId || !body.receiverId || !body.content?.trim()) {
      return NextResponse.json({ error: 'Remetente, destinatário e conteúdo são obrigatórios' }, { status: 400 });
    }
    const tenant = await getTenant(tenantId);
    const messages = getInternalMessages(tenant.features);
    const item: InternalMessage = {
      id: body.id || String(Date.now()),
      senderId: body.senderId,
      receiverId: body.receiverId,
      content: body.content.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveInternalMessages(tenantId, [...messages, item]);
    return NextResponse.json({ data: item, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao enviar mensagem' }, { status: 500 });
  }
}
