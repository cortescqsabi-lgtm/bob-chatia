import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('conversations')
    .select('contact_name, contact_phone, channel_type, last_message_at, status', { count: 'exact' })
    .range(from, from + limit - 1)
    .order('last_message_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customers = data?.reduce((acc: any[], curr: any) => {
    if (curr.contact_name && !acc.find((c: any) => c.phone === curr.contact_phone)) {
      acc.push({ name: curr.contact_name, phone: curr.contact_phone, channel: curr.channel_type, last_contact: curr.last_message_at, status: curr.status });
    }
    return acc;
  }, []) || [];

  return NextResponse.json({ data: customers, meta: { total: count || 0, page, limit } });
}
