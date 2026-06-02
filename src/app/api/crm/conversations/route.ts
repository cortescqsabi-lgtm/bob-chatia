import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const from = (page - 1) * limit;

  // Lê o tenant_id do header ou do query param (enviado pelo frontend)
  const tenantId = req.headers.get('x-tenant-id') || searchParams.get('tenant_id') || DEFAULT_TENANT_ID;

  if (searchParams.get('type') === 'channels') {
    const { data } = await supabase.from('channels').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
    return NextResponse.json({ data: data || [] });
  }

  if (searchParams.get('type') === 'counts') {
    const { count: total } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    const { count: active } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active');
    return NextResponse.json({ total: total || 0, active: active || 0 });
  }

  const { data, error, count } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .not('channel_identifier', 'like', '120363%')
    .range(from, from + limit - 1)
    .order('last_message_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const individual = (data || [])
    .filter(c => c.channel_identifier.length <= 14)
    .map(c => ({
      ...c,
      profile_pic_url: c.avatar_url
    }));

  return NextResponse.json({
    data: individual,
    meta: { total: count || 0, page, limit, has_more: (count || 0) > page * limit }
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const tenantId = req.headers.get('x-tenant-id') || body.tenant_id || DEFAULT_TENANT_ID;
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      tenant_id: tenantId,
      channel_type: body.channel_type || 'whatsapp',
      channel_identifier: body.channel_identifier,
      contact_name: body.contact_name,
      contact_phone: body.contact_phone,
      last_message_at: new Date(),
      status: 'active'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, success: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  const { data, error } = await supabase.from('conversations').update({ status }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, success: true });
}
