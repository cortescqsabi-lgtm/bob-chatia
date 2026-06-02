'use client';

import { useEffect, useState } from 'react';

type AnalyticsData = {
  summary: {
    total_conversations: number;
    conversations_today: number;
    conversations_yesterday: number;
    conversations_week: number;
    conversations_month: number;
    total_messages: number;
    messages_today: number;
    messages_yesterday: number;
    messages_week: number;
    ai_messages_week: number;
    ai_response_rate: number;
    resolution_rate: number;
    total_contacts: number;
    new_contacts_week: number;
    total_tokens_week: number;
    kb_files: number;
    kb_chunks: number;
  };
  status_breakdown: Record<string, number>;
  channel_breakdown: Record<string, number>;
  convs_by_day: Record<string, number>;
  msgs_by_day: Record<string, number>;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function delta(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? '+100%' : '—';
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return (pct >= 0 ? '+' : '') + pct + '%';
}

function fmtDay(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
}

// ─── mini bar chart ────────────────────────────────────────────────────────────
function BarChart({ data, color }: { data: Record<string, number>; color: string }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {entries.map(([day, val]) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className={`w-full rounded-t-md ${color} opacity-80 group-hover:opacity-100 transition-all`}
            style={{ height: `${Math.round((val / max) * 56) + 4}px` }}
          />
          <span className="text-[9px] text-gray-400 leading-none">{fmtDay(day)}</span>
          {/* tooltip */}
          <div className="absolute bottom-full mb-1 hidden group-hover:flex items-center justify-center bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
            {val}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, positive
}: { icon: string; label: string; value: string | number; sub?: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border bg-white p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {sub && (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
            positive === undefined ? 'bg-gray-100 text-gray-500'
            : positive ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-600'
          }`}>{sub}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ─── progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label, value, max, color, icon }: {
  label: string; value: number; max: number; color: string; icon?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="flex items-center gap-1.5 font-medium text-gray-700">
          {icon && <span>{icon}</span>}{label}
        </span>
        <span className="text-gray-500">{value} <span className="text-gray-400 text-xs">({pct}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0084c7]" />
        <p className="text-sm">Carregando dados reais...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
      ❌ {error}
    </div>
  );

  if (!data) return null;

  const s = data.summary;
  const totalConvStatus = Object.values(data.status_breakdown).reduce((a, b) => a + b, 0);
  const totalChannels = Object.values(data.channel_breakdown).reduce((a, b) => a + b, 0);

  const channelMeta: Record<string, { icon: string; color: string; label: string }> = {
    whatsapp: { icon: '💬', color: 'bg-green-500', label: 'WhatsApp' },
    instagram: { icon: '📸', color: 'bg-purple-500', label: 'Instagram' },
    facebook: { icon: '👤', color: 'bg-blue-600', label: 'Facebook' },
    webchat: { icon: '🌐', color: 'bg-cyan-500', label: 'Web Chat' },
  };

  const statusMeta: Record<string, { icon: string; color: string; label: string }> = {
    waiting: { icon: '⏳', color: 'bg-yellow-400', label: 'Aguardando' },
    active: { icon: '🟢', color: 'bg-green-400', label: 'Ativo' },
    attending: { icon: '👤', color: 'bg-blue-400', label: 'Em Atendimento' },
    resolved: { icon: '✅', color: 'bg-gray-400', label: 'Resolvido' },
    archived: { icon: '📁', color: 'bg-gray-300', label: 'Arquivado' },
    blocked: { icon: '🚫', color: 'bg-red-400', label: 'Bloqueado' },
  };

  const convsGrowing = s.conversations_today >= s.conversations_yesterday;
  const msgsGrowing = s.messages_today >= s.messages_yesterday;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0084c7]">Visão Geral</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Dados reais dos últimos 7 dias · Atualizado às {lastUpdated}</p>
        </div>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition self-start"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          icon="💬"
          label="Conversas hoje"
          value={s.conversations_today}
          sub={delta(s.conversations_today, s.conversations_yesterday)}
          positive={convsGrowing}
        />
        <StatCard
          icon="📨"
          label="Mensagens hoje"
          value={s.messages_today}
          sub={delta(s.messages_today, s.messages_yesterday)}
          positive={msgsGrowing}
        />
        <StatCard
          icon="✅"
          label="Taxa de resolução"
          value={s.resolution_rate + '%'}
          sub="total"
        />
        <StatCard
          icon="🤖"
          label="Respostas por IA"
          value={s.ai_response_rate + '%'}
          sub="das mensagens"
        />
      </div>

      {/* Second row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard icon="📊" label="Conversas na semana" value={s.conversations_week} />
        <StatCard icon="📩" label="Mensagens na semana" value={s.messages_week} />
        <StatCard icon="👥" label="Contatos cadastrados" value={s.total_contacts} sub={`+${s.new_contacts_week} semana`} positive={true} />
        <StatCard icon="🧠" label="Tokens IA (semana)" value={s.total_tokens_week > 1000 ? (s.total_tokens_week / 1000).toFixed(1) + 'K' : s.total_tokens_week} />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">

        {/* Conversas por dia */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Conversas — últimos 7 dias</h2>
          <p className="text-xs text-gray-400 mb-4">Total na semana: <strong className="text-gray-700">{s.conversations_week}</strong></p>
          <BarChart data={data.convs_by_day} color="bg-[#0084c7]" />
        </section>

        {/* Mensagens por dia */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Mensagens — últimos 7 dias</h2>
          <p className="text-xs text-gray-400 mb-4">Total na semana: <strong className="text-gray-700">{s.messages_week}</strong></p>
          <BarChart data={data.msgs_by_day} color="bg-purple-500" />
        </section>
      </div>

      {/* Breakdowns row */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">

        {/* Canais */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">📱 Canais de atendimento</h2>
          {totalChannels === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma conversa registrada</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(data.channel_breakdown).sort(([,a],[,b]) => b - a).map(([ch, count]) => {
                const meta = channelMeta[ch] || { icon: '💬', color: 'bg-gray-400', label: ch };
                return (
                  <ProgressBar
                    key={ch}
                    label={meta.label}
                    value={count}
                    max={totalChannels}
                    color={meta.color}
                    icon={meta.icon}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Status das conversas */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">📋 Status das conversas</h2>
          {totalConvStatus === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma conversa registrada</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(data.status_breakdown).sort(([,a],[,b]) => b - a).map(([st, count]) => {
                const meta = statusMeta[st] || { icon: '📌', color: 'bg-gray-400', label: st };
                return (
                  <ProgressBar
                    key={st}
                    label={meta.label}
                    value={count}
                    max={totalConvStatus}
                    color={meta.color}
                    icon={meta.icon}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Base de conhecimento + resumo */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">🧠 Base de Conhecimento</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-blue-800">Arquivos indexados</p>
                <p className="text-xs text-blue-600">Documentos enviados ao agente</p>
              </div>
              <span className="text-2xl font-bold text-blue-700">{s.kb_files}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-purple-50 border border-purple-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-purple-800">Trechos indexados</p>
                <p className="text-xs text-purple-600">Chunks disponíveis para busca</p>
              </div>
              <span className="text-2xl font-bold text-purple-700">{s.kb_chunks}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-green-800">Respostas por IA (semana)</p>
                <p className="text-xs text-green-600">Mensagens geradas automaticamente</p>
              </div>
              <span className="text-2xl font-bold text-green-700">{s.ai_messages_week}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center">
        Todos os dados são gerados em tempo real a partir do banco de dados · Período: últimos 7 dias
      </p>
    </div>
  );
}
