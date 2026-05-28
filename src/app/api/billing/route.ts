import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    tenant_id: 'default_tenant',
    plan: 'professional',
    monthly_limit: 5000,
    current_usage: { messages_this_month: 2450, ai_responses_this_month: 1890, storage_gb: 1.2 },
    billing_cycle: {
      start_date: '2024-03-01',
      end_date: '2024-03-31',
      next_billing_date: '2024-04-01'
    },
    amount_due: 297.00,
    currency: 'BRL',
    status: 'active',
    payment_method: { brand: 'visa', last4: '4242' }
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === 'upgrade') {
    return NextResponse.json({ success: true, message: 'Plano atualizado com sucesso!' });
  }
  if (body.action === 'cancel') {
    return NextResponse.json({ success: true, message: 'Assinatura cancelada com sucesso.' });
  }
  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
