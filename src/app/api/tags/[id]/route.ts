import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const id = (await params).id;
  const body = await req.json();
  const { data, error } = await supabase.from('tags').update({ name: body.name, color: body.color }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const id = (await params).id;
  await supabase.from('conversation_tags').delete().eq('tag_id', id);
  await supabase.from('tags').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
