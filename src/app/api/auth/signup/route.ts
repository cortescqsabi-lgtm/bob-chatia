import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { email, password, name, tenant_name } = await req.json();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, tenant_name } }
    });

    if (authError) throw authError;

    if (authData.user) {
      const adminClient = getSupabaseAdmin();
      const { data: tenant, error: tenantError } = await adminClient
        .from('tenants')
        .insert({ name: tenant_name || name + "'s Company", plan: 'free', monthly_limit: 100, status: 'active' })
        .select()
        .single();

      if (tenantError) throw tenantError;

      const { error: userError } = await adminClient
        .from('users')
        .insert({ id: authData.user.id, email, full_name: name, tenant_id: tenant.id, role: 'admin' });

      if (userError) throw userError;

      return NextResponse.json({
        success: true,
        user: { ...authData.user, tenant_id: tenant.id, role: 'admin', _resolvedRole: 'admin' },
        session: authData.session
      });
    }

    return NextResponse.json({ success: true, user: authData.user, session: authData.session });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', message: error.message || 'Erro ao criar conta' } },
      { status: 400 }
    );
  }
}
