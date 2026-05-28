import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import crypto from 'crypto';

function verifyWebhookSignature(req: NextRequest, secret: string): boolean {
  const signature = req.headers.get('x-webhook-signature') || '';
  const payload = JSON.stringify(req.body);
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(computedSignature, 'hex'));
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    if (body.id && body.message) {
      const contactPhone = body.contact?.phone || '';
      const conversationId = body.conversation_id;

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          tenant_id: 'default_tenant',
          channel_type: 'whatsapp',
          channel_identifier: contactPhone.replace(/\D/g, ''),
          contact_name: body.contact?.name || null,
          last_message_at: new Date(body.timestamp * 1000),
          status: 'active'
        })
        .select()
        .single();

      if (conversation) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          tenant_id: conversation.tenant_id,
          role: body.direction === 'incoming' ? 'user' : 'assistant',
          content: body.message?.text || '',
          type: body.message?.type || 'text',
          direction: body.direction as 'incoming' | 'outgoing',
          ai_generated: false
        });

        await supabase.from('ai_processing_queue').insert({
          conversation_id: conversation.id,
          message_id: body.id,
          status: 'pending'
        });
      }

      return Response.json({ status: 'ok', messageId: body.id });
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
