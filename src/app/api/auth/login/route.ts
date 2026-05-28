import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { email, password } = await req.json();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', message: 'Email ou senha inválidos' } },
      { status: 401 }
    );
  }
}
