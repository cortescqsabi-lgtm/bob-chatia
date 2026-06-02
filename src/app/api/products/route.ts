import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

function getTenantId(req: NextRequest) {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
}

// ── GET: listar produtos do tenant ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const tenantId = getTenantId(req);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const from = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })
    .range(from, from + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Retorna também as categorias únicas do tenant
  const { data: catData } = await supabase
    .from('products')
    .select('category')
    .eq('tenant_id', tenantId)
    .not('category', 'is', null);

  const categories = [...new Set((catData || []).map(c => c.category).filter(Boolean))].sort();

  return NextResponse.json({
    data: data || [],
    categories,
    meta: { total: count || 0, page, limit, has_more: (count || 0) > page * limit }
  });
}

// ── POST: criar produto ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const tenantId = getTenantId(req);
  const body = await req.json();

  const { data, error } = await supabase
    .from('products')
    .insert({ ...body, tenant_id: tenantId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, success: true }, { status: 201 });
}

// ── PUT: atualizar produto ────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const tenantId = getTenantId(req);
  const body = await req.json();
  const { id, ...rest } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('products')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId) // garante isolamento
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, success: true });
}

// ── DELETE: remover produto ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const tenantId = getTenantId(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId); // garante isolamento

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
