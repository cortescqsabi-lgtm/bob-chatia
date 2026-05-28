import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('knowledge_base_files')
    .select('*')
    .order('priority', { ascending: true });
  return Response.json({ data: data || [] });
}
