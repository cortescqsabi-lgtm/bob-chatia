import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const from = (page - 1) * limit;

  if (searchParams.get('type') === 'channels') {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from('channels').select('*').order('created_at', { ascending: false });
    return NextResponse.json({ data: data || [] });
  }

  const { data, error, count } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .range(from, from + limit - 1)
    .order('last_message_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    meta: { total: count || 0, page, limit, has_more: (count || 0) > limit }
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      tenant_id: body.tenant_id || 'default_tenant',
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
