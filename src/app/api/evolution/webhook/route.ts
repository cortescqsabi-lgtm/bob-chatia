import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function extractMessageContent(data: any): { text: string; type: string } {
  if (!data.message) return { text: '', type: 'text' };
  const msg = data.message;
  if (msg.conversation) return { text: msg.conversation, type: 'text' };
  if (msg.extendedTextMessage?.text) return { text: msg.extendedTextMessage.text, type: 'text' };
  if (msg.imageMessage) return { text: msg.imageMessage.caption || '', type: 'image' };
  if (msg.documentMessage) return { text: msg.documentMessage.caption || '', type: 'document' };
  if (msg.locationMessage) return { text: `${msg.locationMessage.latitude},${msg.locationMessage.longitude}`, type: 'location' };
  return { text: '', type: 'text' };
}

function extractPhone(remoteJid: string): string {
  if (!remoteJid) return '';
  return remoteJid.replace(/@s\.whatsapp\.net$/, '').replace(/\D/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    if (body.event === 'MESSAGES_UPSERT' && body.data?.key) {
      const { key, message, pushName } = body.data;
      const remoteJid = key.remoteJid || '';
      const phone = extractPhone(remoteJid);
      const isFromMe = key.fromMe === true;
      const msgId = key.id || '';

      const { text, type } = extractMessageContent(body.data);

      if (!phone || isFromMe) {
        return Response.json({ status: 'ok', ignored: isFromMe ? 'outgoing' : 'no_phone' });
      }

      const { data: existing } = await supabase
        .from('conversations')
        .select('id, tenant_id')
        .eq('channel_identifier', phone)
        .eq('channel_type', 'whatsapp')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversation = existing;
      if (!conversation) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            tenant_id: '00000000-0000-0000-0000-000000000001',
            channel_type: 'whatsapp',
            channel_identifier: phone,
            contact_name: pushName || null,
            last_message_at: new Date().toISOString(),
            status: 'active'
          })
          .select()
          .single();
        conversation = newConv;
      }

      if (conversation) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          tenant_id: conversation.tenant_id,
          role: 'user',
          content: text,
          type: type,
          direction: 'incoming',
          ai_generated: false
        });

        await supabase.from('ai_processing_queue').insert({
          conversation_id: conversation.id,
          message_id: msgId,
          status: 'pending'
        });

        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversation.id);
      }

      return Response.json({ status: 'ok', messageId: msgId });
    }

    return Response.json({ error: 'Invalid webhook format' }, { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Webhook processing failed' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ status: 'ok', webhook: 'Evolution API v1.0', timestamp: Date.now() });
}
