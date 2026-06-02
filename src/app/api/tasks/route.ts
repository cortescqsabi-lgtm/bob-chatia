import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

type Task = {
  id: string;
  name: string;
  tagId: string;
  messageTemplate: string;
  type: 'upsell' | 'retorno' | 'qualificacao';
  status: 'pending' | 'running' | 'completed' | 'failed';
  runCount: number;
  successCount: number;
  createdAt: string;
  chipInstance?: string;
};

function getTenantId(req: Request) {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
}

async function ensureTenant(tenantId: string) {
  const supabase = getSupabaseAdmin();
  await supabase.from('tenants').upsert({
    id: tenantId,
    name: tenantId === DEFAULT_TENANT_ID ? 'VendaZap 360' : 'SaaS Customer',
    plan: tenantId === DEFAULT_TENANT_ID ? 'professional' : 'free',
    monthly_limit: tenantId === DEFAULT_TENANT_ID ? 100000 : 100,
    status: 'active',
  }, { onConflict: 'id' });
}

async function getTenant(tenantId: string) {
  const supabase = getSupabaseAdmin();
  await ensureTenant(tenantId);
  const { data, error } = await supabase
    .from('tenants')
    .select('id, features')
    .eq('id', tenantId)
    .single();
  if (error) throw error;
  return data;
}

function getTasks(features: any): Task[] {
  return Array.isArray(features?.tasks) ? features.tasks : [];
}

async function saveTasks(tenantId: string, tasks: Task[]) {
  const supabase = getSupabaseAdmin();
  const tenant = await getTenant(tenantId);
  const features = { ...(tenant.features || {}), tasks };
  const { error } = await supabase.from('tenants').update({ features }).eq('id', tenantId);
  if (error) throw error;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const tenant = await getTenant(tenantId);
    return NextResponse.json({ data: getTasks(tenant.features) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar tarefas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.name?.trim() || !body.tagId || !body.messageTemplate?.trim()) {
      return NextResponse.json({ error: 'Nome, tag e modelo de mensagem sao obrigatorios' }, { status: 400 });
    }
    const tenant = await getTenant(tenantId);
    const tasks = getTasks(tenant.features);
    const item: Task = {
      id: body.id || String(Date.now()),
      name: body.name.trim(),
      tagId: body.tagId,
      messageTemplate: body.messageTemplate.trim(),
      type: body.type || 'follow-up',
      status: body.status || 'pending',
      runCount: Number(body.runCount || 0),
      successCount: Number(body.successCount || 0),
      createdAt: body.createdAt || new Date().toISOString(),
      chipInstance: body.chipInstance || 'b2zap',
    };
    await saveTasks(tenantId, [item, ...tasks.filter((t) => t.id !== item.id)]);
    return NextResponse.json({ data: item, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao salvar tarefa' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    const tasks = getTasks(tenant.features);
    const next = tasks.map((item) => item.id === body.id ? {
      ...item,
      name: body.name?.trim() || item.name,
      tagId: body.tagId || item.tagId,
      messageTemplate: body.messageTemplate?.trim() || item.messageTemplate,
      type: body.type || item.type,
      status: body.status || item.status,
      runCount: Number(body.runCount ?? item.runCount),
      successCount: Number(body.successCount ?? item.successCount),
      chipInstance: body.chipInstance || item.chipInstance || 'b2zap',
    } : item);
    await saveTasks(tenantId, next);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    await saveTasks(tenantId, getTasks(tenant.features).filter((item) => item.id !== id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir tarefa' }, { status: 500 });
  }
}
