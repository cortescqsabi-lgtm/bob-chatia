import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

async function getTenantAIConfig(tenantId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('ai_configurations')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  return data || null;
}

async function retrieveContext(tenantId: string, query: string, topK = 5, threshold = 0.5) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  const vector = embedding.data[0].embedding;
  const vectorStr = `[${vector.join(',')}]`;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.rpc('search_chunks', {
    p_tenant_id: tenantId,
    p_embedding: JSON.parse(vectorStr),
    p_match_threshold: threshold,
    p_match_count: topK
  });

  return data || [];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { conversation_id, message, temperature = 0.7 } = await req.json();
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const aiConfig = await getTenantAIConfig(tenantId);
    const ragEnabled = aiConfig?.rag_enabled !== false;

    let contextChunks: any[] = [];
    if (ragEnabled) {
      try {
        contextChunks = await retrieveContext(tenantId, message, aiConfig?.rag_top_k || 5);
      } catch (e) {
        console.error('RAG search error:', e);
      }
    }

    const contextBlock = contextChunks.length > 0
      ? contextChunks.map((c: any) => `[${c.file_name}] ${c.content}`).join('\n\n')
      : '';

    const systemPrompt = aiConfig?.system_prompt_template || `Você é o assistente virtual da empresa.`;

    const fullPrompt = `${systemPrompt}

${contextBlock ? 'Use as informacoes abaixo para responder:\n' + contextBlock : ''}

Responda em portugues (pt-BR). Seja conciso (max 3 paragrafos). Se nao souber responder, diga que nao tem essa informacao.`;

    const llmProvider = aiConfig?.llm_provider || 'openai';
    const startTime = Date.now();
    let responseContent = '';

    if (llmProvider === 'openai') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: aiConfig?.model_name || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: message }
        ],
        temperature: parseFloat(temperature.toString()),
        max_tokens: 4096
      });
      responseContent = response?.choices?.[0]?.message?.content || 'Nao consegui processar sua mensagem.';
    }

    const responseTime = Date.now() - startTime;

    const { data: msg } = await supabase.from('messages').insert({
      conversation_id,
      tenant_id: tenantId,
      role: 'assistant',
      content: responseContent,
      type: 'text',
      direction: 'outgoing',
      ai_generated: true,
      ai_response_time_ms: responseTime,
      ai_context_chunks: contextChunks.length > 0 ? contextChunks : null
    }).select().single();

    return Response.json({
      messageId: msg?.id || Date.now().toString(),
      role: 'assistant',
      content: responseContent,
      tokens_used: Math.ceil(responseContent.length / 4),
      response_time_ms: responseTime,
      rag_chunks: contextChunks.length,
      rag_sources: contextChunks.map((c: any) => c.file_name).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return Response.json(
      { error: { code: 'AI_SERVICE_ERROR', message: 'Falha ao processar com IA' } },
      { status: 500 }
    );
  }
}
