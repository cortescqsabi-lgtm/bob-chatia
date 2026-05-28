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
  const { conversation_id, content, type = 'text', media_url } = await req.json();

  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('id, tenant_id, channel_identifier')
    .eq('id', conversation_id)
    .single();
  if (convErr || !conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      tenant_id: conv.tenant_id,
      role: 'assistant',
      content: media_url || content,
      type,
      direction: 'outgoing',
      ai_generated: false,
      status: 'sent'
    })
    .select()
    .single();
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  const evoUrl = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
  const evoKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

  try {
    let evoRes: Response;
    const number = conv.channel_identifier;
    const instance = 'b2zap';

    if (type === 'image') {
      evoRes = await fetch(`${evoUrl}/message/sendMedia/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
        body: JSON.stringify({ number, mediatype: 'image', media: media_url, caption: content || '' })
      });
    } else if (type === 'video') {
      evoRes = await fetch(`${evoUrl}/message/sendMedia/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
        body: JSON.stringify({ number, mediatype: 'video', media: media_url, caption: content || '' })
      });
    } else if (type === 'audio') {
      evoRes = await fetch(`${evoUrl}/message/sendWhatsAppAudio/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
        body: JSON.stringify({ number, audio: media_url })
      });
    } else {
      evoRes = await fetch(`${evoUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
        body: JSON.stringify({ number, text: content })
      });
    }

    const evoData = evoRes.ok ? await evoRes.json().catch(()=>({})) : null;

    if (evoRes.ok && evoData?.key?.id) {
      await supabase.from('messages').update({ evolution_msg_id: evoData.key.id }).eq('id', msg.id);
    } else if (!evoRes.ok) {
      const txt = await evoRes.text().catch(()=>'');
      console.error('Evolution send failed:', evoRes.status, txt);
      await supabase.from('messages').update({ status: 'failed' }).eq('id', msg.id);
    } else {
      console.error('Evolution response missing key.id:', JSON.stringify(evoData));
    }
  } catch (e) {
    console.error('Evolution send error:', e);
    await supabase.from('messages').update({ status: 'failed' }).eq('id', msg.id);
  }

  const { data: updatedMsg } = await supabase.from('messages').select('*').eq('id', msg.id).single();

  if (updatedMsg?.status === 'failed') {
    return NextResponse.json({ success: false, error: 'Falha ao enviar mensagem via WhatsApp', data: updatedMsg }, { status: 502 });
  }

  return NextResponse.json({ success: true, data: updatedMsg || msg });
}
