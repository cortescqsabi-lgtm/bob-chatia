import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

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
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({ name: tenant_name || name + "'s Company", plan: 'free', monthly_limit: 100, status: 'active' })
        .select()
        .single();

      if (tenantError) throw tenantError;

      await supabase.from('users').insert({ id: authData.user.id, email, full_name: name, tenant_id: tenant.id, role: 'admin' });
    }

    return NextResponse.json({ success: true, user: authData.user, session: authData.session });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', message: error.message || 'Erro ao criar conta' } },
      { status: 400 }
    );
  }
}
