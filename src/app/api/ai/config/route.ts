import { NextRequest } from 'next/server';
import { DEFAULT_AGENT_PROMPT, DEFAULT_TENANT_ID, getAIConfig, saveAIConfig } from '@/lib/ai-agent';

function toClientConfig(data: any) {
  return {
    llm_provider: data?.llm_provider || 'openai',
    model_name: data?.model_name || 'gpt-4-turbo',
    temperature: Number(data?.temperature ?? 0.7),
    max_tokens: Number(data?.max_tokens ?? 800),
    rag_enabled: data?.rag_enabled !== false,
    rag_top_k: Number(data?.rag_top_k ?? 3),
    rag_threshold: Number(data?.rag_threshold ?? 0.75),
    system_prompt_template: data?.system_prompt_template || DEFAULT_AGENT_PROMPT,
    positive_prompt: data?.positive_prompt || '',
    negative_prompt: data?.negative_prompt || '',
    auto_responses_enabled: data?.fallback_to_cache !== false,
    api_key: data?.api_key || '',
  };
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const data = await getAIConfig(tenantId);
    return Response.json({ success: true, data: toClientConfig(data) });
  } catch (error: any) {
    console.error('AI config GET error:', error);
    return Response.json({ success: false, error: error?.message || 'Erro ao carregar configuracao' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const body = await req.json();
    const data = await saveAIConfig(body, tenantId);
    return Response.json({ success: true, data: toClientConfig(data) });
  } catch (error: any) {
    console.error('AI config PUT error:', error);
    return Response.json({ success: false, error: error?.message || 'Erro ao salvar configuracao' }, { status: 500 });
  }
}
