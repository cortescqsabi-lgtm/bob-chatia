import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Tenta fazer o upload padrão para o bucket 'media'
    let uploadResult = await supabase.storage.from('media').upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

    // Se o bucket não existir, tenta criar o bucket automaticamente e refazer o upload
    if (
      uploadResult.error &&
      (uploadResult.error.message.toLowerCase().includes('not found') ||
        uploadResult.error.message.toLowerCase().includes('does not exist') ||
        uploadResult.error.message.toLowerCase().includes('bucket_not_found'))
    ) {
      console.log("Bucket 'media' não encontrado. Tentando criar bucket público...");
      const { error: createError } = await supabase.storage.createBucket('media', {
        public: true, // público para as fotos carregarem no chat e no navegador
      });

      if (!createError) {
        // Tentar o upload novamente
        uploadResult = await supabase.storage.from('media').upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });
      } else {
        return NextResponse.json({ error: 'Bucket "media" não existe e falhou ao criar automaticamente: ' + createError.message }, { status: 500 });
      }
    }

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: urlData.publicUrl, fileName });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno: ' + err.message }, { status: 500 });
  }
}
