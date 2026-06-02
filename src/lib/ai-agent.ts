import OpenAI from 'openai';
import { getSupabaseAdmin } from '@/lib/supabase';

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Busca catálogo de produtos do tenant para injetar no contexto da IA
async function getProductsCatalog(tenantId: string): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('products')
      .select('sku, name, description, category, base_price, stock_quantity, is_active, image_url')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .gt('stock_quantity', 0) // Exclui produtos sem estoque (estoque zero)
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .limit(300);

    if (!data || data.length === 0) return '';

    const lines = data.map(p => {
      const price = p.base_price ? `R$ ${Number(p.base_price).toFixed(2).replace('.', ',')}` : 'consultar';
      const stock = p.stock_quantity != null ? `Estoque: ${p.stock_quantity}` : '';
      const cat = p.category ? `[${p.category}] ` : '';
      const desc = p.description ? ` — ${p.description}` : '';
      const photo = p.image_url ? ` | Foto/Imagem URL: ${p.image_url}` : '';
      return `• ${cat}${p.name} (SKU: ${p.sku}) | Preço: ${price}${stock ? ' | ' + stock : ''}${photo}${desc}`;
    });

    return `\n\n=== CATÁLOGO DE PRODUTOS INFORMATIVO (${data.length} itens disponíveis em estoque) ===\n${lines.join('\n')}\n=== FIM DO CATÁLOGO ===`;
  } catch {
    return '';
  }
}

export const DEFAULT_AGENT_PROMPT = `Você é o vendedor de IA da VendaZap 360.

Seu objetivo é atender leads pelo WhatsApp e conduzir a conversa para uma venda.
Fale em português do Brasil, com tom humano, direto e consultivo.

Regras:
- Responda de forma curta, natural e comercial.
- Faça uma pergunta por vez para entender a necessidade do cliente.
- Se o cliente demonstrar interesse, avance para proposta, agendamento ou encaminhamento ao time.
- Se faltar informação, peça exatamente o dado que falta.
- Nunca invente preço, prazo, garantia ou condição que não esteja na base de conhecimento.
- Quando apresentar ou falar sobre um produto que tenha "Foto/Imagem URL" disponível no catálogo, inclua OBRIGATORIAMENTE essa URL exata da foto no final da sua mensagem de forma natural (ex: "Aqui está a foto do produto: [URL_DA_FOTO]"), para que o sistema de mensagens envie a imagem real ao cliente no WhatsApp.
- Quando perceber lead quente, diga que vai deixar tudo pronto para a equipe finalizar.`;

export async function getAIConfig(tenantId = DEFAULT_TENANT_ID) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('ai_configurations')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  return data || null;
}

export async function saveAIConfig(payload: any, tenantId = DEFAULT_TENANT_ID) {
  const supabase = getSupabaseAdmin();
  await supabase.from('tenants').upsert({
    id: tenantId,
    name: 'VendaZap 360',
    plan: 'professional',
    monthly_limit: 100000,
    status: 'active',
  }, { onConflict: 'id' });

  const existing = await getAIConfig(tenantId);
  const data = {
    tenant_id: tenantId,
    llm_provider: payload.llm_provider || 'openai',
    model_name: payload.model_name || 'gpt-4-turbo',
    temperature: Number(payload.temperature ?? 0.7),
    max_tokens: Number(payload.max_tokens ?? 800),
    rag_enabled: payload.rag_enabled !== false,
    rag_top_k: Number(payload.rag_top_k ?? 3),
    rag_threshold: Number(payload.rag_threshold ?? 0.75),
    system_prompt_template: payload.system_prompt_template || DEFAULT_AGENT_PROMPT,
    fallback_to_cache: payload.auto_responses_enabled !== false,
    api_key: payload.api_key || null,
  };

  if (existing?.id) {
    const { data: updated, error } = await supabase
      .from('ai_configurations')
      .update(data)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  const { data: inserted, error } = await supabase
    .from('ai_configurations')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return inserted;
}

export async function generateAgentReply({
  tenantId = DEFAULT_TENANT_ID,
  conversationId,
  message,
}: {
  tenantId?: string;
  conversationId: string;
  message: string;
}) {
  const supabase = getSupabaseAdmin();
  const aiConfig = await getAIConfig(tenantId);
  const productsCatalog = await getProductsCatalog(tenantId);
  const systemPrompt = (aiConfig?.system_prompt_template || DEFAULT_AGENT_PROMPT) + productsCatalog;
  const model = aiConfig?.model_name || 'gpt-4-turbo';
  const temperature = Number(aiConfig?.temperature ?? 0.7);
  const maxTokens = Number(aiConfig?.max_tokens ?? 800);

  const { data: history } = await supabase
    .from('messages')
    .select('role, content, direction, created_at')
    .eq('conversation_id', conversationId)
    .eq('type', 'text')
    .order('created_at', { ascending: false })
    .limit(8);

  const messages = [...(history || [])].reverse().map((item: any) => ({
    role: item.role === 'user' ? 'user' as const : 'assistant' as const,
    content: item.content || '',
  }));

  const apiKey = aiConfig?.api_key || process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });
  const start = Date.now();
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return {
    content: response?.choices?.[0]?.message?.content || 'Perfeito, me conta um pouco mais para eu te ajudar melhor.',
    responseTimeMs: Date.now() - start,
  };
}

export async function sendWhatsAppText(number: string, text: string, tenantId?: string) {
  const evoUrl = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
  const evoKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
  const instance = tenantId ? `instance_${tenantId}` : 'b2zap';

  const res = await fetch(`${evoUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
    body: JSON.stringify({ number, text }),
  });

  const data = res.ok ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Evolution sendText failed: ${res.status} ${body}`);
  }
  return data;
}

export async function sendWhatsAppMedia(number: string, mediaUrl: string, caption: string, tenantId?: string) {
  const evoUrl = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
  const evoKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
  const instance = tenantId ? `instance_${tenantId}` : 'b2zap';

  const res = await fetch(`${evoUrl}/message/sendMedia/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
    body: JSON.stringify({
      number,
      mediatype: 'image',
      media: mediaUrl,
      caption: caption
    }),
  });

  const data = res.ok ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Evolution sendMedia failed: ${res.status} ${body}`);
  }
  return data;
}
