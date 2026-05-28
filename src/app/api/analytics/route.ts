import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabase();
  const tenantId = 'default_tenant';

  const today = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: messagesToday } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', today);

  const { count: activeConvs } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  const { data: aiUsage } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', weekAgo);

  return NextResponse.json({
    metrics: {
      messages_today: messagesToday || 0,
      active_conversations: activeConvs || 0,
      ai_responses: aiUsage?.length || 0,
      total_tokens: aiUsage?.reduce((acc: number, curr: any) => acc + (curr.tokens_input || 0) + (curr.tokens_output || 0), 0) || 0
    },
    ai_usage: aiUsage || [],
    period: { start: weekAgo, end: new Date().toISOString() }
  });
}
