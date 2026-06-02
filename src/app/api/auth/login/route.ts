import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { email, password } = await req.json();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Busca o usuário na tabela 'users' para obter o tenant_id e role corretos
    let role = 'admin';
    let tenantId = DEFAULT_TENANT_ID;

    try {
      const admin = getSupabaseAdmin();
      const { data: dbUser } = await admin
        .from('users')
        .select('tenant_id, role')
        .eq('id', data.user.id)
        .single();

      if (dbUser) {
        tenantId = dbUser.tenant_id;
        role = dbUser.role;
      }
    } catch (e) {
      console.error('Error fetching user from database:', e);
    }

    return NextResponse.json({
      success: true,
      user: { ...data.user, _resolvedRole: role, tenant_id: tenantId },
      session: data.session
    });
  } catch (error: any) {
    // Detecta email não confirmado
    const isEmailNotConfirmed =
      error?.message?.toLowerCase().includes('email not confirmed') ||
      error?.message?.toLowerCase().includes('email_not_confirmed') ||
      error?.code === 'email_not_confirmed';

    const message = isEmailNotConfirmed
      ? 'Por favor, confirme seu email antes de entrar. Verifique sua caixa de entrada.'
      : `Email ou senha inválidos. (${error?.message || 'erro desconhecido'})`;

    return NextResponse.json(
      { error: { code: isEmailNotConfirmed ? 'EMAIL_NOT_CONFIRMED' : 'AUTH_ERROR', message } },
      { status: 401 }
    );
  }
}
