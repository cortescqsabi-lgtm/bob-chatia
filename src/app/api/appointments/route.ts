import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

type Appointment = {
  id: string;
  title: string;
  contact_name: string;
  contact_phone: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes: string;
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

function getAppointments(features: any): Appointment[] {
  return Array.isArray(features?.appointments) ? features.appointments : [];
}

async function saveAppointments(tenantId: string, appointments: Appointment[]) {
  const supabase = getSupabaseAdmin();
  const tenant = await getTenant(tenantId);
  const features = { ...(tenant.features || {}), appointments };
  const { error } = await supabase.from('tenants').update({ features }).eq('id', tenantId);
  if (error) throw error;
}

function getGMT3DateTime() {
  const localDate = new Date();
  const utc = localDate.getTime() + (localDate.getTimezoneOffset() * 60000);
  const gmt3Date = new Date(utc - (3 * 3600000));
  const year = gmt3Date.getFullYear();
  const month = String(gmt3Date.getMonth() + 1).padStart(2, '0');
  const day = String(gmt3Date.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const hours = String(gmt3Date.getHours()).padStart(2, '0');
  const minutes = String(gmt3Date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  return { todayStr, timeStr };
}

async function sendScheduledWhatsApp(tenantId: string, name: string, phone: string, text: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return false;
  
  try {
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('channel_identifier', cleanPhone)
      .eq('tenant_id', tenantId)
      .single();
      
    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          channel_identifier: cleanPhone,
          contact_name: name || 'Agendamento',
          channel_type: 'whatsapp',
          tenant_id: tenantId,
          status: 'active',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      if (!newConv) return false;
      conv = newConv;
    }
    
    const { data: msg } = await supabase
      .from('messages')
      .insert({
        conversation_id: conv.id,
        tenant_id: tenantId,
        role: 'assistant',
        content: text,
        type: 'text',
        direction: 'outgoing',
        ai_generated: false,
        status: 'sent'
      })
      .select()
      .single();
    if (!msg) return false;
    
    const evoUrl = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
    const evoKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    
    const instance = tenantId === DEFAULT_TENANT_ID ? 'b2zap' : `instance_${tenantId}`;
    const evoRes = await fetch(`${evoUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
      body: JSON.stringify({ number: cleanPhone, text })
    });
    
    const evoData = evoRes.ok ? await evoRes.json().catch(()=>({})) : null;
    if (evoRes.ok && evoData?.key?.id) {
      await supabase.from('messages').update({ evolution_msg_id: evoData.key.id }).eq('id', msg.id);
      return true;
    } else {
      await supabase.from('messages').update({ status: 'failed' }).eq('id', msg.id);
      return false;
    }
  } catch (e) {
    console.error('Scheduled send error:', e);
    return false;
  }
}

async function checkAndSendDueMessages(tenantId: string, appointments: Appointment[]): Promise<Appointment[]> {
  const { todayStr, timeStr } = getGMT3DateTime();
  let changed = false;
  
  const next = await Promise.all(appointments.map(async (ap) => {
    if (ap.status === 'agendado' && `${ap.date} ${ap.time}` <= `${todayStr} ${timeStr}`) {
      changed = true;
      let messageText = ap.notes || ap.title;
      if (ap.contact_name) {
        messageText = messageText.replace(/\{nome\}/gi, ap.contact_name);
      }
      const success = await sendScheduledWhatsApp(tenantId, ap.contact_name, ap.contact_phone, messageText);
      return { ...ap, status: success ? 'enviado' : 'failed' };
    }
    return ap;
  }));
  
  if (changed) {
    await saveAppointments(tenantId, next);
    return next;
  }
  return appointments;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const tenant = await getTenant(tenantId);
    const rawAppointments = getAppointments(tenant.features);
    const checkedAppointments = await checkAndSendDueMessages(tenantId, rawAppointments);
    const sorted = checkedAppointments.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    return NextResponse.json({ data: sorted });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar agendamentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    const notes = body.notes?.trim() || '';
    const title = body.title?.trim() || notes.slice(0, 50) || 'Mensagem agendada';
    if ((!notes && !title) || !body.date || !body.time) {
      return NextResponse.json({ error: 'Mensagem, data e horário são obrigatórios' }, { status: 400 });
    }
    const tenant = await getTenant(tenantId);
    const appointments = getAppointments(tenant.features);
    const item: Appointment = {
      id: body.id || String(Date.now()),
      title: title,
      contact_name: body.contact_name?.trim() || '',
      contact_phone: body.contact_phone?.trim() || '',
      date: body.date,
      time: body.time,
      type: body.type || 'WhatsApp',
      status: body.status || 'agendado',
      notes: notes,
    };
    await saveAppointments(tenantId, [item, ...appointments.filter((a) => a.id !== item.id)]);
    return NextResponse.json({ data: item, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao salvar agendamento' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    const appointments = getAppointments(tenant.features);
    const next = appointments.map((item) => item.id === body.id ? {
      ...item,
      title: body.title?.trim() || body.notes?.trim()?.slice(0, 50) || item.title,
      contact_name: body.contact_name?.trim() || '',
      contact_phone: body.contact_phone?.trim() || '',
      date: body.date || item.date,
      time: body.time || item.time,
      type: body.type || item.type || 'WhatsApp',
      status: body.status || item.status,
      notes: body.notes?.trim() || item.notes,
    } : item);
    await saveAppointments(tenantId, next);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    await saveAppointments(tenantId, getAppointments(tenant.features).filter((item) => item.id !== id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir agendamento' }, { status: 500 });
  }
}
