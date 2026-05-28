import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== 'page' && body.object !== 'instagram') {
      return Response.json({ status: 'ok' });
    }

    const supabase = getSupabaseAdmin();

    for (const entry of body.entry || []) {
      const pageId = entry.id;

      const { data: channel } = await supabase
        .from('channels')
        .select('id, tenant_id')
        .eq('phone_number', pageId)
        .maybeSingle();

      if (!channel) continue;

      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const msg = change.value;
          const messageText = msg.message?.text || '';
          const senderId = msg.sender?.id || '';
          const senderName = msg.sender?.name || '';

          let { data: conversation } = await supabase
            .from('conversations')
            .select('id')
            .eq('channel_identifier', senderId)
            .eq('channel_type', 'facebook')
            .maybeSingle();

          if (!conversation) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                tenant_id: channel.tenant_id,
                channel_type: 'facebook',
                channel_identifier: senderId,
                contact_name: senderName,
                last_message_at: new Date().toISOString(),
                status: 'active'
              })
              .select()
              .single();
            conversation = newConv;
          }

          if (conversation && messageText) {
            await supabase.from('messages').insert({
              conversation_id: conversation.id,
              tenant_id: channel.tenant_id,
              role: 'user',
              content: messageText,
              type: 'text',
              direction: 'incoming',
              ai_generated: false
            });

            await supabase.from('ai_processing_queue').insert({
              conversation_id: conversation.id,
              status: 'pending'
            });
          }
        }
      }
    }

    return Response.json({ status: 'ok' });
  } catch (error) {
    console.error('Meta webhook error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return Response.json({ error: 'Invalid verification' }, { status: 403 });
}
