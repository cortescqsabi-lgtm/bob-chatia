import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'id obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Exclui os chunks vinculados ao arquivo primeiro
    const { error: chunksError } = await supabase
      .from('knowledge_base_chunks')
      .delete()
      .eq('file_id', id);

    if (chunksError) {
      console.error('Erro ao excluir chunks:', chunksError);
      // Não aborta — tenta excluir o arquivo de qualquer forma
    }

    // Exclui o arquivo da base
    const { error: fileError } = await supabase
      .from('knowledge_base_files')
      .delete()
      .eq('id', id);

    if (fileError) {
      return Response.json({ error: fileError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Erro ao excluir arquivo' }, { status: 500 });
  }
}
