import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';
import { Storage } from '@google-cloud/storage';

function getTenantId(req: NextRequest) {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const tenantId = getTenantId(req);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Buscar a configuração de armazenamento do tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('storage_config')
      .eq('id', tenantId)
      .single();

    if (tenantError) {
      return NextResponse.json({ error: 'Erro ao buscar configurações do tenant: ' + tenantError.message }, { status: 500 });
    }

    const storageConfig = tenant?.storage_config || { provider: 'supabase' };

    if (storageConfig.provider === 'gcs' && storageConfig.gcs) {
      const { bucketName, projectId, clientEmail, privateKey } = storageConfig.gcs;

      if (!bucketName || !projectId || !clientEmail || !privateKey) {
        return NextResponse.json({ error: 'Configurações do Google Cloud Storage incompletas no painel de configurações.' }, { status: 400 });
      }

      try {
        const storage = new Storage({
          projectId,
          credentials: {
            client_email: clientEmail,
            private_key: privateKey.replace(/\\n/g, '\n'), // Substitui novas linhas escapadas
          },
        });

        const bucket = storage.bucket(bucketName);
        const gcsFile = bucket.file(fileName);

        await gcsFile.save(buffer, {
          contentType: file.type,
          resumable: false,
          metadata: {
            cacheControl: 'public, max-age=31536000',
          },
        });

        // Tentar tornar o arquivo público (caso o bucket não tenha acesso de leitura pública uniforme herdado)
        try {
          await gcsFile.makePublic();
        } catch (pubErr) {
          console.warn('Não foi possível forçar makePublic(). Certifique-se de que o bucket GCS tem acesso de leitura público.', pubErr);
        }

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        return NextResponse.json({ success: true, url: publicUrl, fileName });
      } catch (gcsErr: any) {
        return NextResponse.json({ error: 'Erro ao fazer upload no Google Cloud Storage: ' + gcsErr.message }, { status: 500 });
      }
    }

    // Default: Supabase Storage
    const { data, error } = await supabase.storage.from('media').upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: urlData.publicUrl, fileName });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno: ' + err.message }, { status: 500 });
  }
}
