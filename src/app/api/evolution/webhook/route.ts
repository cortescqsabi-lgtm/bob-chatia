import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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

function isGroup(remoteJid: string): boolean {
  return remoteJid.endsWith('@g.us') || /^\d{15,}/.test(remoteJid.replace(/@\w+\.\w+$/, '').replace(/\D/g, ''));
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const event = (body.event || '').toLowerCase().replace(/\./g, '_');

    if (event === 'messages_upsert') {
      const messages = Array.isArray(body.data) ? body.data : (body.data ? [body.data] : []);

      for (const msgData of messages) {
        if (!msgData?.key) continue;
        const { key, pushName } = msgData;
        const remoteJid = key.remoteJid || '';
        const phone = extractPhone(remoteJid);
        const isFromMe = key.fromMe === true;
        const msgId = key.id || '';
        const { text, type } = extractMessageContent(msgData);

        if (!phone || isFromMe || !text || isGroup(remoteJid)) continue;

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
              status: 'waiting'
            })
            .select()
            .single();
          conversation = newConv;
        }

        if (conversation) {
          try { await supabase.from('messages').insert({ conversation_id: conversation.id, tenant_id: conversation.tenant_id, role: 'user', content: text, type: type, direction: 'incoming', ai_generated: false }); } catch (e) { console.error('Insert message error:', e); }
          try { await supabase.from('ai_processing_queue').insert({ conversation_id: conversation.id, message_id: msgId, status: 'pending' }); } catch (e) { console.error('Insert queue error:', e); }
          try { await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id); } catch (e) { console.error('Update conv error:', e); }
        }
      }

      return Response.json({ status: 'ok' });
    }

    if (event === 'messages_update') {
      const data = body.data || body;
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const key = item.key || item.key;
        const update = item.update || {};
        if (!key?.id) continue;
        const statusMap: Record<string, string> = { 'SERVER_ACK': 'sent', 'DELIVERY_ACK': 'delivered', 'READ': 'read' };
        const newStatus = statusMap[update.status] || (typeof update.status === 'number' ? (['sent','sent','delivered','read'][update.status]) : null);
        if (newStatus) {
          await supabase.from('messages').update({ status: newStatus }).eq('evolution_msg_id', key.id);
        }
      }
      return Response.json({ status: 'ok' });
    }

    if (event === 'connection_update') {
      return Response.json({ status: 'ok' });
    }

    return Response.json({ status: 'ok', event });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ status: 'ok', error: 'processing' });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', webhook: 'Evolution API v1.0', timestamp: Date.now() });
}
