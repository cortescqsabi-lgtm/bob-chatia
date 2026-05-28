import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { query, tenant_id, top_k = 5, threshold = 0.75 } = await req.json();

    if (!query || !tenant_id) {
      return Response.json({ error: 'query and tenant_id required' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });

    const vector = embedding.data[0].embedding;

    const supabase = getSupabaseAdmin();
    const { data } = await supabase.rpc('search_chunks', {
      p_tenant_id: tenant_id,
      p_embedding: JSON.parse(`[${vector.join(',')}]`),
      p_match_threshold: threshold,
      p_match_count: top_k
    });

    return Response.json({ data: data || [] });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
