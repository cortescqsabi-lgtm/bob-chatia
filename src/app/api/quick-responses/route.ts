import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

type QuickResponse = {
  id: string;
  shortcut: string;
  title: string;
  content: string;
};

function getTenantId(req: Request) {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
}

async function getTenant(tenantId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tenants')
    .select('id, features')
    .eq('id', tenantId)
    .single();
  if (error) {
    const { data: newTenant, error: newError } = await supabase
      .from('tenants')
      .upsert({ id: tenantId, name: 'SaaS Customer', plan: 'free', monthly_limit: 100, status: 'active' }, { onConflict: 'id' })
      .select('id, features')
      .single();
    if (newError) throw newError;
    return newTenant;
  }
  return data;
}

function getResponses(features: any): QuickResponse[] {
  return Array.isArray(features?.quick_responses) ? features.quick_responses : [];
}

async function saveResponses(tenantId: string, responses: QuickResponse[]) {
  const supabase = getSupabaseAdmin();
  const tenant = await getTenant(tenantId);
  const features = { ...(tenant.features || {}), quick_responses: responses };
  const { error } = await supabase.from('tenants').update({ features }).eq('id', tenantId);
  if (error) throw error;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const tenant = await getTenant(tenantId);
    return NextResponse.json({ data: getResponses(tenant.features) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar respostas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json({ error: 'Titulo e resposta sao obrigatorios' }, { status: 400 });
    }
    const tenant = await getTenant(tenantId);
    const responses = getResponses(tenant.features);
    const item: QuickResponse = {
      id: body.id || String(Date.now()),
      shortcut: (body.shortcut || body.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'resposta',
      title: body.title.trim(),
      content: body.content.trim(),
    };
    const next = [item, ...responses.filter((r) => r.id !== item.id)];
    await saveResponses(tenantId, next);
    return NextResponse.json({ data: item, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao salvar resposta' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    const responses = getResponses(tenant.features);
    const next = responses.map((item) => item.id === body.id ? {
      ...item,
      shortcut: (body.shortcut || item.shortcut).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || item.shortcut,
      title: body.title?.trim() || item.title,
      content: body.content?.trim() || item.content,
    } : item);
    await saveResponses(tenantId, next);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar resposta' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    await saveResponses(tenantId, getResponses(tenant.features).filter((item) => item.id !== id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir resposta' }, { status: 500 });
  }
}
