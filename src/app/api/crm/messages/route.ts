import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversation_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!conversationId) {
    return NextResponse.json({ error: { message: 'conversation_id é obrigatório' } }, { status: 400 });
  }

  const from = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .range(from, from + limit - 1)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [], meta: { total: count || 0, page, limit } });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { conversation_id, content, type = 'text' } = await req.json();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      tenant_id: 'default_tenant',
      role: 'assistant',
      content,
      type,
      direction: 'outgoing',
      ai_generated: false
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
