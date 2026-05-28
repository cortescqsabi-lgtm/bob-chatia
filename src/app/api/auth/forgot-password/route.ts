import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { email } = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/auth/login` });
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Email de recuperação enviado!' });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Erro ao enviar email' } },
      { status: 400 }
    );
  }
}
