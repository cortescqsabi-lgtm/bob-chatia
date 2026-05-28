import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

function splitIntoChunks(text: string, chunkSize = 500, overlap = 100): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    if ((current + p).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + '\n\n' + p;
    } else {
      current += (current ? '\n\n' : '') + p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { file_name, content, tenant_id } = await req.json();

    if (!file_name || !content || !tenant_id) {
      return Response.json({ error: 'file_name, content, and tenant_id required' }, { status: 400 });
    }

    const { data: file } = await supabase.from('knowledge_base_files').insert({
      tenant_id,
      file_name,
      file_path: '/knowledge-base/' + file_name,
      is_default: false,
      priority: 10
    }).select().single();

    if (!file) {
      return Response.json({ error: 'Failed to create file record' }, { status: 500 });
    }

    const chunks = splitIntoChunks(content);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks
    });

    const rows = chunks.map((chunk, i) => ({
      file_id: file.id,
      tenant_id,
      chunk_index: i,
      content: chunk,
      embedding: embeddings.data[i]?.embedding
        ? `[${embeddings.data[i].embedding.join(',')}]`
        : null,
      tokens: Math.ceil(chunk.length / 4)
    }));

    for (const row of rows) {
      if (row.embedding) {
        await supabase.rpc('insert_chunk', {
          p_file_id: row.file_id,
          p_tenant_id: row.tenant_id,
          p_chunk_index: row.chunk_index,
          p_content: row.content,
          p_embedding: JSON.parse(row.embedding),
          p_tokens: row.tokens
        });
      }
    }

    return Response.json({
      success: true,
      file_id: file.id,
      chunks: rows.length,
      file_name
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
