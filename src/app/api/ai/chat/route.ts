import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID, generateAgentReply } from '@/lib/ai-agent';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { conversation_id, message } = await req.json();

    if (!conversation_id || !message) {
      return Response.json({ error: { code: 'BAD_REQUEST', message: 'conversation_id e message sao obrigatorios' } }, { status: 400 });
    }

    const { content, responseTimeMs } = await generateAgentReply({
      tenantId: DEFAULT_TENANT_ID,
      conversationId: conversation_id,
      message,
    });

    const { data: msg } = await supabase.from('messages').insert({
      conversation_id,
      tenant_id: DEFAULT_TENANT_ID,
      role: 'assistant',
      content,
      type: 'text',
      direction: 'outgoing',
      ai_generated: true,
      ai_response_time_ms: responseTimeMs,
    }).select().single();

    return Response.json({
      messageId: msg?.id || Date.now().toString(),
      role: 'assistant',
      content,
      tokens_used: Math.ceil(content.length / 4),
      response_time_ms: responseTimeMs,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return Response.json(
      { error: { code: 'AI_SERVICE_ERROR', message: 'Falha ao processar com IA' } },
      { status: 500 }
    );
  }
}
