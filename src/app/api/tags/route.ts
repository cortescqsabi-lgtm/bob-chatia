import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const TENANT = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('tags').select('*').eq('tenant_id', TENANT).order('name');
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { action, name, color, conversation_id, tag_id } = body;

  if (action === 'assign' && conversation_id && tag_id) {
    const { error } = await supabase.from('conversation_tags').insert({ conversation_id, tag_id }).select().single();
    if (error && error.code === '23505') return NextResponse.json({ success: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'unassign' && conversation_id && tag_id) {
    await supabase.from('conversation_tags').delete().eq('conversation_id', conversation_id).eq('tag_id', tag_id);
    return NextResponse.json({ success: true });
  }

  if (action === 'get_tags' && conversation_id) {
    const { data } = await supabase.from('conversation_tags').select('tag_id, tags(*)').eq('conversation_id', conversation_id);
    return NextResponse.json({ data: data?.map((r: any) => r.tags) || [] });
  }

  if (name) {
    const { data, error } = await supabase.from('tags').insert({ tenant_id: TENANT, name, color: color || '#6366f1' }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: 'invalid request' }, { status: 400 });
}
