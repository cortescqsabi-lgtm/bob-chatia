import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendedor';
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

function getUsers(features: any): DashboardUser[] {
  return Array.isArray(features?.users) ? features.users : [];
}

async function saveUsers(tenantId: string, users: DashboardUser[]) {
  const supabase = getSupabaseAdmin();
  const tenant = await getTenant(tenantId);
  const features = { ...(tenant.features || {}), users };
  const { error } = await supabase.from('tenants').update({ features }).eq('id', tenantId);
  if (error) throw error;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const tenant = await getTenant(tenantId);
    const users = getUsers(tenant.features);
    return NextResponse.json({ data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar usuários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim() || !body.role) {
      return NextResponse.json({ error: 'Nome, email, senha e perfil são obrigatórios' }, { status: 400 });
    }
    const tenant = await getTenant(tenantId);
    const users = getUsers(tenant.features);

    let authUserId = '';
    const supabase = getSupabaseAdmin();
    
    // Create user in Supabase auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email.trim().toLowerCase(),
      password: body.password.trim(),
      email_confirm: true,
      user_metadata: { name: body.name.trim(), role: body.role }
    });
    if (authError) {
      return NextResponse.json({ error: 'Erro ao criar usuário no Supabase: ' + authError.message }, { status: 400 });
    }
    
    if (authUser?.user?.id) {
      authUserId = authUser.user.id;
      
      // Write to public.users table for session validation and tenant scoping
      const { error: dbUserError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: body.email.trim().toLowerCase(),
          full_name: body.name.trim(),
          tenant_id: tenantId,
          role: body.role
        });
      if (dbUserError) {
        // cleanup auth user if DB insert failed
        await supabase.auth.admin.deleteUser(authUserId);
        return NextResponse.json({ error: 'Erro ao criar perfil de usuário: ' + dbUserError.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Falha ao obter ID do usuário criado' }, { status: 500 });
    }

    const item: DashboardUser = {
      id: authUserId,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role,
    };
    await saveUsers(tenantId, [item, ...users.filter((u) => u.id !== item.id)]);
    return NextResponse.json({ data: item, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao salvar usuário' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    const users = getUsers(tenant.features);

    const supabase = getSupabaseAdmin();
    const updateData: any = {
      email: body.email?.trim()?.toLowerCase(),
      user_metadata: { name: body.name?.trim(), role: body.role }
    };
    if (body.password?.trim()) {
      updateData.password = body.password.trim();
    }
    
    // Update auth user
    const { error: authError } = await supabase.auth.admin.updateUserById(body.id, updateData);
    if (authError) {
      return NextResponse.json({ error: 'Erro ao atualizar usuário no Supabase: ' + authError.message }, { status: 400 });
    }

    // Update public.users record
    const dbUpdate: any = {
      email: body.email?.trim()?.toLowerCase(),
      full_name: body.name?.trim(),
      role: body.role,
      updated_at: new Date().toISOString()
    };
    const { error: dbError } = await supabase
      .from('users')
      .update(dbUpdate)
      .eq('id', body.id)
      .eq('tenant_id', tenantId);
    if (dbError) {
      return NextResponse.json({ error: 'Erro ao atualizar perfil no banco: ' + dbError.message }, { status: 500 });
    }

    const next = users.map((item) => item.id === body.id ? {
      ...item,
      name: body.name?.trim() || item.name,
      email: body.email?.trim()?.toLowerCase() || item.email,
      role: body.role || item.role,
    } : item);
    await saveUsers(tenantId, next);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    const tenant = await getTenant(tenantId);
    
    const supabase = getSupabaseAdmin();
    
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    // Ignore error if user already deleted in auth
    
    // Delete from public.users
    await supabase.from('users').delete().eq('id', id).eq('tenant_id', tenantId);

    await saveUsers(tenantId, getUsers(tenant.features).filter((item) => item.id !== id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao excluir usuário' }, { status: 500 });
  }
}
