import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;

  const now = new Date();
  const today = new Date(now); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);

  // ── Conversations ──────────────────────────────────────────────────────────
  const { data: allConvs } = await supabase
    .from('conversations')
    .select('id, status, channel_type, created_at')
    .eq('tenant_id', tenantId);

  const convs = allConvs || [];
  const convsToday = convs.filter(c => new Date(c.created_at) >= today).length;
  const convsYesterday = convs.filter(c => new Date(c.created_at) >= yesterday && new Date(c.created_at) < today).length;
  const convsWeek = convs.filter(c => new Date(c.created_at) >= weekAgo).length;
  const convsMonth = convs.filter(c => new Date(c.created_at) >= monthAgo).length;

  // Status breakdown
  const statusCount: Record<string,number> = {};
  convs.forEach(c => { statusCount[c.status] = (statusCount[c.status] || 0) + 1; });

  // Channel breakdown
  const channelCount: Record<string,number> = {};
  convs.forEach(c => { const ch = c.channel_type || 'whatsapp'; channelCount[ch] = (channelCount[ch] || 0) + 1; });

  // Conversations per day (last 7 days)
  const convsByDay: Record<string,number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    convsByDay[d.toISOString().slice(0,10)] = 0;
  }
  convs.filter(c => new Date(c.created_at) >= weekAgo).forEach(c => {
    const day = new Date(c.created_at).toISOString().slice(0,10);
    if (day in convsByDay) convsByDay[day] = (convsByDay[day] || 0) + 1;
  });

  // ── Messages ──────────────────────────────────────────────────────────────
  const { data: allMsgs } = await supabase
    .from('messages')
    .select('id, role, direction, created_at')
    .eq('tenant_id', tenantId);

  const msgs = allMsgs || [];
  const msgsToday = msgs.filter(m => new Date(m.created_at) >= today).length;
  const msgsYesterday = msgs.filter(m => new Date(m.created_at) >= yesterday && new Date(m.created_at) < today).length;
  const msgsWeek = msgs.filter(m => new Date(m.created_at) >= weekAgo).length;
  const aiMsgs = msgs.filter(m => m.role === 'assistant' || m.direction === 'outgoing');
  const aiMsgsWeek = aiMsgs.filter(m => new Date(m.created_at) >= weekAgo).length;

  // Messages per day (last 7 days)
  const msgsByDay: Record<string,number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    msgsByDay[d.toISOString().slice(0,10)] = 0;
  }
  msgs.filter(m => new Date(m.created_at) >= weekAgo).forEach(m => {
    const day = new Date(m.created_at).toISOString().slice(0,10);
    if (day in msgsByDay) msgsByDay[day] = (msgsByDay[day] || 0) + 1;
  });

  // ── AI Usage ───────────────────────────────────────────────────────────────
  const { data: aiUsage } = await supabase
    .from('ai_usage_logs')
    .select('tokens_input, tokens_output, created_at, model')
    .eq('tenant_id', tenantId)
    .gte('created_at', weekAgo.toISOString());

  const totalTokens = (aiUsage || []).reduce((acc, curr) =>
    acc + (curr.tokens_input || 0) + (curr.tokens_output || 0), 0);

  // ── Contacts ───────────────────────────────────────────────────────────────
  const { count: totalContacts } = await supabase
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: newContactsWeek } = await supabase
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', weekAgo.toISOString());

  // ── KB files ───────────────────────────────────────────────────────────────
  const { count: kbFiles } = await supabase
    .from('knowledge_base_files')
    .select('*', { count: 'exact', head: true });

  const { count: kbChunks } = await supabase
    .from('knowledge_base_chunks')
    .select('*', { count: 'exact', head: true });

  // ── Resolution rate ────────────────────────────────────────────────────────
  const resolved = statusCount['resolved'] || 0;
  const total = convs.length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // ── AI rate (ai messages / total messages) ─────────────────────────────────
  const aiRate = msgs.length > 0 ? Math.round((aiMsgs.length / msgs.length) * 100) : 0;

  return NextResponse.json({
    summary: {
      total_conversations: total,
      conversations_today: convsToday,
      conversations_yesterday: convsYesterday,
      conversations_week: convsWeek,
      conversations_month: convsMonth,
      total_messages: msgs.length,
      messages_today: msgsToday,
      messages_yesterday: msgsYesterday,
      messages_week: msgsWeek,
      ai_messages_week: aiMsgsWeek,
      ai_response_rate: aiRate,
      resolution_rate: resolutionRate,
      total_contacts: totalContacts || 0,
      new_contacts_week: newContactsWeek || 0,
      total_tokens_week: totalTokens,
      kb_files: kbFiles || 0,
      kb_chunks: kbChunks || 0,
    },
    status_breakdown: statusCount,
    channel_breakdown: channelCount,
    convs_by_day: convsByDay,
    msgs_by_day: msgsByDay,
    period: {
      start: weekAgo.toISOString(),
      end: now.toISOString(),
    }
  });
}
