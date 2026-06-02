import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID, generateAgentReply, getAIConfig, sendWhatsAppText } from '@/lib/ai-agent';

function extractMessageContent(data: any): { text: string; type: string; mediaUrl?: string } {
  if (!data.message) return { text: '', type: 'text' };
  const msg = data.message;
  if (msg.conversation) return { text: msg.conversation, type: 'text' };
  if (msg.extendedTextMessage?.text) return { text: msg.extendedTextMessage.text, type: 'text' };
  if (msg.imageMessage) return { text: msg.imageMessage.caption || '', type: 'image', mediaUrl: msg.imageMessage.url };
  if (msg.videoMessage) return { text: msg.videoMessage.caption || '', type: 'video', mediaUrl: msg.videoMessage.url };
  if (msg.audioMessage) return { text: '', type: 'audio', mediaUrl: msg.audioMessage.url };
  if (msg.documentMessage) return { text: msg.documentMessage.caption || '', type: 'document', mediaUrl: msg.documentMessage.url };
  if (msg.locationMessage) return { text: `${msg.locationMessage.latitude},${msg.locationMessage.longitude}`, type: 'location' };
  if (msg.stickerMessage) return { text: '', type: 'sticker' };
  return { text: '', type: 'text' };
}

const EVO_URL = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

async function uploadToSupabase(supabase: any, buffer: Buffer, mime: string): Promise<string|null> {
  try {
    const cleanMime = mime.split(';')[0].trim().toLowerCase() || 'application/octet-stream';
    const extMap: Record<string,string> = { 'mpeg': 'mp3', 'mp4': 'm4a', 'x-wav': 'wav', 'x-msvideo': 'avi', 'x-matroska': 'mkv' };
    const rawExt = cleanMime.split('/')[1] || 'bin';
    const ext = extMap[rawExt] || rawExt.replace(/[^a-z0-9]/g, '') || 'bin';
    const fileName = `webhook_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('media').upload(fileName, buffer, { contentType: cleanMime, upsert: true });
    if (uploadError) { console.error('Storage upload error:', uploadError); return null; }
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { console.error('uploadToSupabase error:', e); return null; }
}

async function downloadMedia(supabase: any, msgData: any, instance: string, mediaUrl?: string, msgType?: string): Promise<string|null> {
  const log = (s: string) => console.log(`[downloadMedia ${msgType}] ${s}`);
  // Try #1: direct URL with apikey
  if (mediaUrl) {
    try {
      log(`direct fetch: ${mediaUrl.slice(0,80)}`);
      const res = await fetch(mediaUrl, { headers: { 'apikey': EVO_KEY } });
      log(`direct status: ${res.status}`);
      if (res.ok) {
        const mime = res.headers.get('content-type') || 'application/octet-stream';
        log(`direct mime: ${mime}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const url = await uploadToSupabase(supabase, buf, mime);
        if (url) { log(`direct ok: ${url}`); return url; }
        log('direct upload returned null');
      }
    } catch (e: any) { log(`direct fetch error: ${e.message}`); }
  } else { log('no mediaUrl for direct fetch'); }

  // Try #2: getBase64FromMediaMessage (simplified - just send key)
  try {
    log('trying getBase64FromMediaMessage');
    const res = await fetch(`${EVO_URL}/chat/getBase64FromMediaMessage/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({ message: { key: msgData.key }, convertToMp4: false })
    });
    log(`getBase64 status: ${res.status}`);
    if (!res.ok) { const t = await res.text().catch(()=>''); log(`getBase64 body: ${t.slice(0,200)}`); return null; }
    const json = await res.json();
    log(`getBase64 has base64: ${!!json?.base64}, mimetype: ${json?.mimetype}`);
    if (!json?.base64) return null;
    const mime = json.mimetype || 'application/octet-stream';
    const buf = Buffer.from(json.base64, 'base64');
    log(`base64 length: ${buf.length} bytes`);
    return await uploadToSupabase(supabase, buf, mime);
  } catch (e: any) { log(`getBase64 error: ${e.message}`); return null; }

  // Try #3: raw URL without apikey (some WhatsApp CDN URLs are accessible briefly)
  if (mediaUrl && mediaUrl.startsWith('http')) {
    try {
      log('trying raw fetch without apikey');
      const res = await fetch(mediaUrl, { headers: { 'apikey': EVO_KEY } }); // Try with apikey first
      log(`raw+apikey status: ${res.status}`);
      if (res.ok) {
        const mime = res.headers.get('content-type') || 'application/octet-stream';
        const buf = Buffer.from(await res.arrayBuffer());
        const url = await uploadToSupabase(supabase, buf, mime);
        if (url) { log(`raw+apikey ok: ${url}`); return url; }
      } else {
        // Try without apikey as fallback
        log('trying raw fetch without apikey');
        const res2 = await fetch(mediaUrl);
        log(`raw status: ${res2.status}`);
        if (res2.ok) {
          const mime2 = res2.headers.get('content-type') || 'application/octet-stream';
          const buf2 = Buffer.from(await res2.arrayBuffer());
          const url2 = await uploadToSupabase(supabase, buf2, mime2);
          if (url2) { log(`raw ok: ${url2}`); return url2; }
        }
      }
    } catch (e: any) { log(`raw fetch error: ${e.message}`); }
  }

  return null;
}

async function fetchProfilePic(phone: string, instance: string): Promise<string|null> {
  try {
    const res = await fetch(`${EVO_URL}/chat/fetchProfilePictureUrl/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({ number: phone })
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return json?.profilePictureUrl || json?.profilePicUrl || json?.picture || json?.url || null;
  } catch (e: any) {
    console.error('fetchProfilePic error:', e?.message || e);
    return null;
  }
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

    // Resolve tenantId and instanceName from body.instance (e.g. "instance_00000000-0000-0000-0000-000000000001")
    const instanceName = body.instance || 'b2zap';
    let tenantId = DEFAULT_TENANT_ID;
    if (instanceName.startsWith('instance_')) {
      const parsed = instanceName.substring('instance_'.length);
      if (parsed !== 'undefined' && parsed !== 'null' && parsed.trim()) {
        tenantId = parsed;
      }
    }

    console.log(`[webhook] event=${event} body keys=${Object.keys(body).join(',')} dataType=${typeof body.data} dataIsArray=${Array.isArray(body.data)}`);
    if (event === 'messages_upsert') {
      const messages = Array.isArray(body.data) ? body.data : (body.data ? [body.data] : []);
      console.log(`[webhook] messages_upsert count=${messages.length}`);
      for (const msgData of messages) {
        if (!msgData?.key) { console.log('[webhook] skip no key'); continue; }
        const { key, pushName } = msgData;
        const remoteJid = key.remoteJid || '';
        const phone = extractPhone(remoteJid);
        const isFromMe = key.fromMe === true;
        const msgId = key.id || '';
        const { text, type, mediaUrl } = extractMessageContent(msgData);

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
        console.log(`[webhook] processing phone=${phone} type=${type} text="${(text||'').slice(0,40)}"`);

        let mediaPublicUrl: string|null = null;
        let finalType = type;
        if (type === 'image' || type === 'video' || type === 'audio' || type === 'sticker') {
          mediaPublicUrl = await downloadMedia(supabase, msgData, instanceName, mediaUrl, type);
          if (!mediaPublicUrl) finalType = 'text';
        }
        if (type === 'audio' || type === 'video') finalType = 'text';
        const finalContent = mediaPublicUrl || text || (mediaUrl && (type === 'audio' || type === 'video') ? mediaUrl : '');

        const { data: existing } = await supabase
          .from('conversations')
          .select('id, tenant_id, status')
          .eq('channel_identifier', phone)
          .eq('channel_type', 'whatsapp')
          .eq('tenant_id', tenantId)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let conversation = existing;
        let profilePicUrl = msgData.profilePicUrl || msgData.sender?.profilePicUrl || null;
        if (!profilePicUrl) profilePicUrl = await fetchProfilePic(phone, instanceName);
        if (!conversation) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              tenant_id: tenantId,
              channel_type: 'whatsapp',
              channel_identifier: phone,
              contact_phone: phone,
              contact_name: pushName || null,
              last_message_at: new Date().toISOString(),
              status: 'waiting',
              avatar_url: profilePicUrl
            })
            .select()
            .single();
          conversation = newConv;
        }

        if (conversation) {
          const msgInsert: any = { 
            conversation_id: conversation.id, 
            tenant_id: conversation.tenant_id, 
            role: 'user', 
            content: finalContent, 
            type: finalType, 
            media_url: mediaPublicUrl || mediaUrl || null, 
            direction: 'incoming', 
            ai_generated: false,
            evolution_msg_id: msgId
          };
          if (type !== 'text') msgInsert.metadata = { originalType: type };
          try { await supabase.from('messages').insert(msgInsert); } catch (e) { console.error('Insert message error:', e); }
          try { await supabase.from('ai_processing_queue').insert({ conversation_id: conversation.id, message_id: msgId, status: 'pending' }); } catch (e) { console.error('Insert queue error:', e); }
          const updateData: Record<string, any> = { last_message_at: new Date().toISOString() };
          if (pushName) updateData.contact_name = pushName;
          updateData.contact_phone = phone;
          if (profilePicUrl) updateData.avatar_url = profilePicUrl;
          if (conversation.status === 'resolved') updateData.status = 'waiting';
          try { await supabase.from('conversations').update(updateData).eq('id', conversation.id); } catch (e) { console.error('Update conv error:', e); }

          if (finalType === 'text' && finalContent.trim()) {
            try {
              const aiConfig = await getAIConfig(conversation.tenant_id || DEFAULT_TENANT_ID);
              const autoEnabled = aiConfig?.fallback_to_cache !== false;
              if (autoEnabled) {
                const reply = await generateAgentReply({
                  tenantId: conversation.tenant_id || DEFAULT_TENANT_ID,
                  conversationId: conversation.id,
                  message: finalContent,
                });
                await sendWhatsAppText(phone, reply.content, conversation.tenant_id);
                const { data: outMsg } = await supabase.from('messages').insert({
                  conversation_id: conversation.id,
                  tenant_id: conversation.tenant_id || DEFAULT_TENANT_ID,
                  role: 'assistant',
                  content: reply.content,
                  type: 'text',
                  direction: 'outgoing',
                  ai_generated: true,
                  ai_response_time_ms: reply.responseTimeMs,
                  status: 'sent',
                } as any).select().single();
                await supabase.from('ai_processing_queue').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('message_id', msgId);
                console.log(`[webhook] auto reply sent message=${outMsg?.id || 'unknown'}`);
              }
            } catch (e: any) {
              console.error('Auto agent reply error:', e?.message || e);
              await supabase.from('ai_processing_queue').update({ status: 'failed', last_error: e?.message || String(e) }).eq('message_id', msgId);
            }
          }
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
