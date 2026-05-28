import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  let query = supabase
    .from('conversations')
    .select('contact_name, contact_phone, contact_email, profile_pic_url, channel_type, channel_identifier')
    .not('contact_phone', 'is', null)
    .neq('contact_phone', '')
    .order('contact_name', { ascending: true });

  if (search) {
    query = query.or(`contact_name.ilike.%${search}%,contact_phone.ilike.%${search}%,contact_email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // deduplicate by phone
  const seen = new Set<string>();
  const contacts = (data || []).filter(c => {
    if (seen.has(c.contact_phone)) return false;
    seen.add(c.contact_phone);
    return true;
  }).map(c => ({
    id: c.contact_phone,
    name: c.contact_name || 'Unknown',
    phone: c.contact_phone,
    email: c.contact_email,
    avatar_url: c.profile_pic_url,
    channel_type: c.channel_type,
  }));

  return NextResponse.json({ data: contacts, meta: { total: contacts.length } });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { name, phone, email, channel_type } = body;
  if (!name || !phone) return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });

  // upsert into conversations
  const { data, error } = await supabase.from('conversations').upsert({
    channel_identifier: phone.replace(/\D/g, ''),
    channel_type: channel_type || 'whatsapp',
    contact_name: name,
    contact_phone: phone,
    contact_email: email || null,
    tenant_id: '00000000-0000-0000-0000-000000000001',
    last_message_at: new Date().toISOString(),
    status: 'waiting',
  }, { onConflict: 'channel_identifier', ignoreDuplicates: false }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: {
    id: data.contact_phone,
    name: data.contact_name,
    phone: data.contact_phone,
    email: data.contact_email,
    avatar_url: data.profile_pic_url,
    channel_type: data.channel_type,
  }}, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { id, name, phone, email, channel_type } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('conversations')
    .update({ contact_name: name, contact_phone: phone, contact_email: email || null, channel_type: channel_type || 'whatsapp' })
    .eq('contact_phone', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('conversations')
    .update({ contact_phone: null, contact_name: null })
    .eq('contact_phone', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
