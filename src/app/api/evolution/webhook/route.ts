import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function extractMessageContent(data: any): { text: string; type: string } {
  if (!data.message) return { text: '', type: 'text' };
  const msg = data.message;
  if (msg.conversation) return { text: msg.conversation, type: 'text' };
  if (msg.extendedTextMessage?.text) return { text: msg.extendedTextMessage.text, type: 'text' };
  if (msg.imageMessage) return { text: msg.imageMessage.caption || '', type: 'image' };
  if (msg.videoMessage) return { text: msg.videoMessage.caption || '', type: 'video' };
  if (msg.audioMessage) return { text: '', type: 'audio' };
  if (msg.documentMessage) return { text: msg.documentMessage.caption || '', type: 'document' };
  if (msg.locationMessage) return { text: `${msg.locationMessage.latitude},${msg.locationMessage.longitude}`, type: 'location' };
  if (msg.stickerMessage) return { text: '', type: 'sticker' };
  return { text: '', type: 'text' };
}

const EVO_URL = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

async function downloadMedia(supabase: any, msgData: any, instance: string): Promise<string|null> {
  try {
    const res = await fetch(`${EVO_URL}/chat/getBase64FromMediaMessage/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({ message: { key: msgData.key }, convertToMp4: false })
    });
    if (!res.ok) { console.error('getBase64 failed:', res.status); return null; }
    const json = await res.json();
    if (!json?.base64) { console.error('getBase64 missing base64:', JSON.stringify(json)); return null; }
    const mime = json.mimetype || 'application/octet-stream';
    const buffer = Buffer.from(json.base64, 'base64');
    const ext = mime.split('/')[1] || 'bin';
    const fileName = `webhook_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('media').upload(fileName, buffer, { contentType: mime, upsert: true });
    if (uploadError) { console.error('Storage upload error:', uploadError); return null; }
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { console.error('downloadMedia error:', e); return null; }
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

        if (!phone || isGroup(remoteJid)) continue;

        if (isFromMe && msgData.status) {
          const statusMap: Record<string, string> = { 'PENDING': 'sent', 'SERVER_ACK': 'sent', 'DELIVERY_ACK': 'delivered', 'READ': 'read' };
          const newStatus = statusMap[msgData.status] || (typeof msgData.status === 'number' ? (['sent','sent','delivered','read'][msgData.status]) : null);
          if (newStatus) {
            await supabase.from('messages').update({ status: newStatus }).eq('evolution_msg_id', key.id).maybeSingle();
          }
          continue;
        }

        if (isFromMe) continue;
        if (!text && type === 'text') continue;

        let mediaUrl: string|null = null;
        let finalType = type;
        if (type === 'image' || type === 'video' || type === 'audio' || type === 'sticker') {
          mediaUrl = await downloadMedia(supabase, msgData, 'b2zap');
          if (!mediaUrl) finalType = 'text';
        }
        const finalContent = mediaUrl || text || '';

        const { data: existing } = await supabase
          .from('conversations')
          .select('id, tenant_id, status')
          .eq('channel_identifier', phone)
          .eq('channel_type', 'whatsapp')
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let conversation = existing;
        const profilePicUrl = msgData.profilePicUrl || msgData.sender?.profilePicUrl || null;
        if (!conversation) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              tenant_id: '00000000-0000-0000-0000-000000000001',
              channel_type: 'whatsapp',
              channel_identifier: phone,
              contact_name: pushName || null,
              last_message_at: new Date().toISOString(),
              status: 'waiting',
              profile_pic_url: profilePicUrl
            })
            .select()
            .single();
          conversation = newConv;
        }

        if (conversation) {
          try { await supabase.from('messages').insert({ conversation_id: conversation.id, tenant_id: conversation.tenant_id, role: 'user', content: finalContent, type: finalType, direction: 'incoming', ai_generated: false }); } catch (e) { console.error('Insert message error:', e); }
          try { await supabase.from('ai_processing_queue').insert({ conversation_id: conversation.id, message_id: msgId, status: 'pending' }); } catch (e) { console.error('Insert queue error:', e); }
          const updateData: Record<string, any> = { last_message_at: new Date().toISOString() };
          if (pushName) updateData.contact_name = pushName;
          if (profilePicUrl) updateData.profile_pic_url = profilePicUrl;
          if (conversation.status === 'resolved') updateData.status = 'waiting';
          try { await supabase.from('conversations').update(updateData).eq('id', conversation.id); } catch (e) { console.error('Update conv error:', e); }
        }
      }

      return Response.json({ status: 'ok' });
    }

    if (event === 'messages_update') {
      const data = body.data || body;
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const keyData = (item && item.key) ? item.key : item;
        const updateData = (item && item.update) ? item.update : {};
        if (!keyData?.id) continue;
        const statusMap: Record<string, string> = { 'SERVER_ACK': 'sent', 'DELIVERY_ACK': 'delivered', 'READ': 'read' };
        const rawStatus = updateData.status;
        const newStatus = statusMap[rawStatus] || (typeof rawStatus === 'number' ? (['sent','sent','delivered','read'][rawStatus]) : null);
        if (newStatus) {
          const { error } = await supabase.from('messages').update({ status: newStatus }).eq('evolution_msg_id', keyData.id);
          if (error) console.error('Status update error:', error, 'key:', keyData.id, 'status:', newStatus);
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
