import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import OpenAI from 'openai';

async function getTenantAIConfig(tenantId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('ai_configurations')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  return data || null;
}

async function retrieveContext(tenantId: string, query: string, topK = 3) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('messages')
    .select('content')
    .eq('tenant_id', tenantId)
    .ilike('content', query)
    .limit(topK);
  return data || [];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { conversation_id, message, temperature = 0.7, rag_enabled = true } = await req.json();
    const tenantId = 'default_tenant';
    const aiConfig = await getTenantAIConfig(tenantId);
    const ragEnabled = aiConfig?.rag_enabled || rag_enabled;

    let contextChunks: { content: string }[] = [];
    if (ragEnabled) {
      contextChunks = await retrieveContext(tenantId, message);
    }

    const systemPrompt = `Você é o assistente virtual da empresa. Responda de forma útil e amigável.

${contextChunks.map((c: { content: string }) => `- ${c.content}`).join('\n')}

Responda em português (pt-BR). Seja conciso (máx 3 parágrafos).`;

    const llmProvider = aiConfig?.llm_provider || 'openai';
    let response: any;

    if (llmProvider === 'openai') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      response = await openai.chat.completions.create({
        model: aiConfig?.model_name || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: parseFloat(temperature.toString()),
        max_tokens: 4096
      });
    }

    const aiMessage = response?.choices?.[0]?.message?.content || 'Não consegui processar sua mensagem.';

    await supabase.from('messages').insert({
      conversation_id,
      tenant_id: tenantId,
      role: 'assistant',
      content: aiMessage,
      type: 'text',
      direction: 'outgoing',
      ai_generated: true,
    });

    return Response.json({
      messageId: Date.now().toString(),
      role: 'assistant',
      content: aiMessage,
      tokens_used: 150,
      response_time_ms: 890
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return Response.json(
      { error: { code: 'AI_SERVICE_ERROR', message: 'Falha ao processar com IA' } },
      { status: 500 }
    );
  }
}
