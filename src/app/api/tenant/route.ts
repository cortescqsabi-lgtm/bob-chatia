import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

function getTenantId(req: NextRequest) {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
}

// ── GET: Obter informações do tenant ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const tenantId = getTenantId(req);

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, timezone, language, status, features, storage_config')
    .eq('id', tenantId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mascarar a chave privada do Google Cloud Storage se ela existir
  if (tenant.storage_config && tenant.storage_config.gcs && tenant.storage_config.gcs.privateKey) {
    tenant.storage_config = {
      ...tenant.storage_config,
      gcs: {
        ...tenant.storage_config.gcs,
        privateKey: '********', // Não expõe a chave real ao cliente
      },
    };
  }

  return NextResponse.json({ data: tenant });
}

// ── PUT: Atualizar informações do tenant ───────────────────────────────────────
export async function PUT(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const tenantId = getTenantId(req);
  const body = await req.json();

  const { name, timezone, language, storage_config } = body;

  // 1. Buscar a configuração atual para preservar a chave privada se vier mascarada
  const { data: currentTenant, error: fetchError } = await supabase
    .from('tenants')
    .select('storage_config')
    .eq('id', tenantId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let finalStorageConfig = storage_config || { provider: 'supabase' };

  if (finalStorageConfig.provider === 'gcs' && finalStorageConfig.gcs) {
    const currentGcs = currentTenant.storage_config?.gcs || {};
    const newGcs = finalStorageConfig.gcs;

    // Se a nova chave privada vier vazia, mascarada ou indefinida, preservar a chave antiga
    const newPrivateKey = newGcs.privateKey;
    if (!newPrivateKey || newPrivateKey === '********') {
      newGcs.privateKey = currentGcs.privateKey || '';
    }
  }

  // 2. Atualizar no banco
  const { data: updatedTenant, error: updateError } = await supabase
    .from('tenants')
    .update({
      name,
      timezone,
      language,
      storage_config: finalStorageConfig,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId)
    .select('id, name, slug, plan, timezone, language, status, features, storage_config')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Mascarar a chave de retorno para o cliente
  if (updatedTenant.storage_config && updatedTenant.storage_config.gcs && updatedTenant.storage_config.gcs.privateKey) {
    updatedTenant.storage_config = {
      ...updatedTenant.storage_config,
      gcs: {
        ...updatedTenant.storage_config.gcs,
        privateKey: '********',
      },
    };
  }

  return NextResponse.json({ data: updatedTenant, success: true });
}
