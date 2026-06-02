import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const admin = getSupabaseAdmin();
    const { data: tenant, error } = await admin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    const created = new Date(tenant.created_at || new Date());
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const trialDaysLeft = Math.max(0, 7 - diffDays);
    const trialExpired = tenant.plan === 'free' && trialDaysLeft <= 0;

    return NextResponse.json({
      tenant_id: tenant.id,
      plan: tenant.plan,
      monthly_limit: tenant.monthly_limit,
      current_usage: { messages_this_month: 2450, ai_responses_this_month: 1890, storage_gb: 1.2 },
      billing_cycle: {
        start_date: tenant.created_at,
        end_date: new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      amount_due: tenant.plan === 'starter' ? 97.00 : tenant.plan === 'professional' ? 297.00 : 0.00,
      currency: 'BRL',
      status: tenant.status,
      trial_days_left: trialDaysLeft,
      trial_expired: trialExpired,
      payment_method: tenant.plan !== 'free' ? { brand: 'visa', last4: '4242' } : null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const body = await req.json();
    const admin = getSupabaseAdmin();

    if (body.action === 'upgrade') {
      const plan = body.plan || 'starter';
      const monthly_limit = plan === 'starter' ? 1000 : plan === 'professional' ? 5000 : 100;
      
      const { error } = await admin
        .from('tenants')
        .update({ plan, status: 'active', monthly_limit })
        .eq('id', tenantId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Plano atualizado com sucesso!', plan });
    }

    if (body.action === 'cancel') {
      const { error } = await admin
        .from('tenants')
        .update({ plan: 'free', status: 'cancelled', monthly_limit: 100 })
        .eq('id', tenantId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Assinatura cancelada com sucesso.' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
