'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrialBlock() {
  const router = useRouter();
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');

  const getTenantId = () => {
    if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000001';
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.tenant_id) return parsed.tenant_id;
      } catch {}
    }
    return '00000000-0000-0000-0000-000000000001';
  };

  const loadBilling = async () => {
    try {
      const res = await fetch('/api/billing', {
        headers: { 'x-tenant-id': getTenantId() }
      });
      const data = await res.json();
      if (res.ok) {
        setBilling(data);
      }
    } catch (e) {
      console.error('Error fetching billing details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleUpgrade = async (plan: 'starter' | 'professional') => {
    setUpgrading(true);
    setError('');
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId()
        },
        body: JSON.stringify({ action: 'upgrade', plan })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local storage user role just in case
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.plan = plan;
            localStorage.setItem('currentUser', JSON.stringify(parsed));
          } catch {}
        }
        await loadBilling();
        window.location.reload();
      } else {
        throw new Error(data.error || 'Erro ao realizar upgrade.');
      }
    } catch (e: any) {
      setError(e.message || 'Falha ao ativar o plano. Tente novamente.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading || !billing) return null;

  // Render a full screen block if trial has expired
  if (billing.trial_expired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-8 border border-gray-100 text-center my-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 text-3xl mb-6 shadow-inner">
            ⚠️
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-3">Seu período de teste expirou</h2>
          <p className="text-gray-600 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Seus 7 dias de teste grátis do **VendaZap 360** terminaram. Para reativar seu acesso e continuar vendendo no automático com IA, selecione um plano abaixo.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 text-left mb-8">
            {/* Starter Plan */}
            <div className="border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-lg transition-all rounded-2xl p-6 flex flex-col justify-between cursor-pointer group" onClick={() => !upgrading && handleUpgrade('starter')}>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Ideal para começar</span>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Plano Starter</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-2xl font-black text-gray-900">R$ 97</span>
                  <span className="text-xs text-gray-500 font-medium">/ mês</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center gap-2">✔️ 1.000 mensagens/mês</li>
                  <li className="flex items-center gap-2">✔️ 3 canais conectados</li>
                  <li className="flex items-center gap-2">✔️ Agente IA treinável (.MD)</li>
                  <li className="flex items-center gap-2">✔️ Suporte via ticket</li>
                </ul>
              </div>
              <button
                disabled={upgrading}
                onClick={(e) => { e.stopPropagation(); handleUpgrade('starter'); }}
                className="w-full bg-[#0084c7] hover:bg-[#0070b0] text-white text-xs font-bold py-3 rounded-xl transition shadow-md disabled:opacity-60"
              >
                {upgrading ? 'Ativando...' : 'Ativar Plano'}
              </button>
            </div>

            {/* Professional Plan */}
            <div className="border-2 border-blue-500 bg-blue-50/30 hover:bg-white hover:shadow-lg transition-all rounded-2xl p-6 flex flex-col justify-between cursor-pointer relative" onClick={() => !upgrading && handleUpgrade('professional')}>
              <span className="absolute -top-3 right-6 bg-blue-600 text-white font-bold text-[9px] uppercase px-2.5 py-1 rounded-full tracking-wider shadow">Mais Popular</span>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Escala máxima</span>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Plano Professional</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-2xl font-black text-gray-900">R$ 297</span>
                  <span className="text-xs text-gray-500 font-medium">/ mês</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center gap-2 font-semibold">✔️ 5.000 mensagens/mês</li>
                  <li className="flex items-center gap-2">✔️ Canais ilimitados</li>
                  <li className="flex items-center gap-2">✔️ Agente IA avançado + RAG</li>
                  <li className="flex items-center gap-2">✔️ Dashboard analítico completo</li>
                </ul>
              </div>
              <button
                disabled={upgrading}
                onClick={(e) => { e.stopPropagation(); handleUpgrade('professional'); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-md disabled:opacity-60"
              >
                {upgrading ? 'Ativando...' : 'Ativar Plano'}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            A ativação simula o pagamento imediato e libera seu acesso na hora.
          </p>
        </div>
      </div>
    );
  }

  // Render a trial banner if user is on free trial
  if (billing.plan === 'free' && billing.trial_days_left > 0) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-3 shadow-md relative z-[1000]">
        <span>⏳ Período de Teste Grátis: restam **{billing.trial_days_left}** dias!</span>
        <button
          onClick={() => handleUpgrade('professional')}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-[10px] uppercase font-bold transition tracking-wider border border-white/30"
        >
          Escolher Plano
        </button>
      </div>
    );
  }

  return null;
}
