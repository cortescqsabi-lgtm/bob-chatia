'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

type AIConfig = {
  llm_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  rag_enabled: boolean;
  rag_top_k: number;
  rag_threshold: number;
  system_prompt_template: string;
  positive_prompt: string;
  negative_prompt: string;
  auto_responses_enabled: boolean;
  api_key: string;
};

const emptyConfig: AIConfig = {
  llm_provider: 'openai',
  model_name: 'gpt-4-turbo',
  temperature: 0.7,
  max_tokens: 800,
  rag_enabled: true,
  rag_top_k: 3,
  rag_threshold: 0.75,
  system_prompt_template: '',
  positive_prompt: '',
  negative_prompt: '',
  auto_responses_enabled: true,
  api_key: '',
};

type KbFile = { id: string; file_name: string; created_at: string; chunk_count?: number };

// ─── helpers ──────────────────────────────────────────────────────────────────

function readFileAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsText(file, 'UTF-8');
  });
}

async function parseExcel(file: File): Promise<string> {
  // Dynamic import to avoid SSR issues
  const XLSX = await import('xlsx');
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  let text = '';
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws);
    text += `=== Aba: ${sheetName} ===\n${csv}\n\n`;
  }
  return text;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // KB / upload state
  const [kbFiles, setKbFiles] = useState<KbFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTenantId = () => {
    if (typeof window === 'undefined') return DEFAULT_TENANT_ID;
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.tenant_id) return parsed.tenant_id;
      } catch {}
    }
    return DEFAULT_TENANT_ID;
  };

  // ── load config ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const tId = getTenantId();
      try {
        const [cfgRes, kbRes] = await Promise.all([
          fetch('/api/ai/config', { headers: { 'x-tenant-id': tId } }),
          fetch('/api/kb/list', { headers: { 'x-tenant-id': tId } }),
        ]);
        const cfg = await cfgRes.json();
        const kb = await kbRes.json();
        if (cfg.data) setConfig({ ...emptyConfig, ...cfg.data });
        if (Array.isArray(kb.data)) setKbFiles(kb.data);
      } catch {
        setStatus('Não foi possível carregar a configuração.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (patch: Partial<AIConfig>) => setConfig((c) => ({ ...c, ...patch }));

  // ── save config ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': getTenantId() },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao salvar');
      setConfig({ ...emptyConfig, ...json.data });
      setStatus('✅ Configuração salva! O agente já usa essas regras nas próximas respostas.');
    } catch (e: any) {
      setStatus('❌ ' + (e?.message || 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  };

  // ── delete KB file ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setUploadStatus('');
    try {
      const res = await fetch(`/api/kb/delete?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': getTenantId() }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao excluir');
      setKbFiles((prev) => prev.filter((f) => f.id !== id));
      setUploadStatus('✅ Arquivo excluído da base de conhecimento.');
    } catch (e: any) {
      setUploadStatus('❌ ' + (e?.message || 'Falha ao excluir.'));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // ── upload file ─────────────────────────────────────────────────────────────
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ['.xlsx', '.xls', '.csv', '.txt', '.pdf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadStatus('❌ Formato não suportado. Use: Excel, CSV, PDF ou TXT.');
      return;
    }

    setUploading(true);
    setUploadStatus('⏳ Lendo arquivo...');

    try {
      const isProductImport = ext === '.xlsx' || ext === '.xls' || ext === '.csv';

      if (isProductImport) {
        setUploadStatus('⏳ Lendo planilha de produtos...');
        const XLSX = await import('xlsx');
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          setUploadStatus('❌ Planilha de produtos vazia ou sem dados.');
          setUploading(false);
          return;
        }

        setUploadStatus('⏳ Importando produtos para a base de dados (upsert)...');
        const res = await fetch('/api/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': getTenantId() },
          body: JSON.stringify({ rows }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao importar produtos');

        setUploadStatus(`✅ "${file.name}" importado com sucesso! ${json.inserted} cadastrados, ${json.updated} atualizados.`);
      } else {
        let content = '';
        if (ext === '.pdf') {
          setUploadStatus('❌ Processamento de PDF direto não suportado. Utilize arquivos de texto para RAG ou planilhas para produtos.');
          setUploading(false);
          return;
        } else {
          content = await readFileAsText(file);
        }

        setUploadStatus('⏳ Enviando para base de conhecimento...');
        const res = await fetch('/api/kb/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': getTenantId() },
          body: JSON.stringify({
            file_name: file.name,
            content,
            tenant_id: getTenantId(),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro no RAG upload');

        setUploadStatus(`✅ "${file.name}" enviado! ${json.chunks} trechos indexados.`);
        // refresh RAG list
        const kbRes = await fetch('/api/kb/list', { headers: { 'x-tenant-id': getTenantId() } });
        const kb = await kbRes.json();
        if (Array.isArray(kb.data)) setKbFiles(kb.data);
      }
    } catch (e: any) {
      setUploadStatus('❌ ' + (e?.message || 'Falha no processamento.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando configuração do agente...</div>;
  }

  return (
    <div className="max-w-5xl">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0084c7]">Agente vendedor de IA</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Configuração do vendedor de milhões</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Defina como a IA responde, quando deve vender, quais limites seguir e se as respostas automáticas ficam ativas no WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => update({ auto_responses_enabled: !config.auto_responses_enabled })}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
            config.auto_responses_enabled ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-500'
          }`}
        >
          <span className={`relative h-7 w-12 rounded-full transition ${config.auto_responses_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${config.auto_responses_enabled ? 'left-6' : 'left-1'}`} />
          </span>
          <span>
            <span className="block text-sm font-bold">{config.auto_responses_enabled ? 'Respostas automáticas ativas' : 'Respostas automáticas pausadas'}</span>
            <span className="block text-xs opacity-80">Controla o agente no WhatsApp</span>
          </span>
        </button>
      </div>

      {/* ── Prompts ── */}
      <div className="mb-6 grid gap-6">

        {/* Prompt Comercial */}
        <section className="rounded-xl border bg-white p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-lg">💬</span>
            <div>
              <h2 className="font-semibold text-gray-900">Prompt Comercial</h2>
              <p className="text-sm text-gray-500 mt-0.5">Instruções gerais de como o agente deve se comportar, apresentar a empresa e conduzir a conversa de vendas.</p>
            </div>
          </div>
          <textarea
            id="prompt-comercial"
            value={config.system_prompt_template}
            onChange={(e) => update({ system_prompt_template: e.target.value })}
            placeholder="Ex: Você é um consultor de vendas da empresa X. Seu objetivo é ajudar o cliente a encontrar o produto ideal de forma consultiva e amigável. Sempre apresente as vantagens antes do preço..."
            className="min-h-[200px] w-full rounded-lg border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-[#0084c7] focus:ring-2 focus:ring-[#0084c7]/10 resize-y"
          />
        </section>

        {/* Prompt Positivo e Negativo lado a lado */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Prompt Positivo */}
          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 text-lg">✅</span>
              <div>
                <h2 className="font-semibold text-gray-900">Prompt Positivo</h2>
                <p className="text-sm text-gray-500 mt-0.5">O que o agente <strong>deve</strong> fazer, destacar ou priorizar em toda conversa.</p>
              </div>
            </div>
            <textarea
              id="prompt-positivo"
              value={config.positive_prompt}
              onChange={(e) => update({ positive_prompt: e.target.value })}
              placeholder="Ex: Sempre mencione os benefícios do produto. Ofereça o parcelamento quando o cliente questionar o preço. Use linguagem amigável e próxima..."
              className="min-h-[180px] w-full rounded-lg border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-y"
            />
          </section>

          {/* Prompt Negativo */}
          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 text-lg">🚫</span>
              <div>
                <h2 className="font-semibold text-gray-900">Prompt Negativo</h2>
                <p className="text-sm text-gray-500 mt-0.5">O que o agente <strong>não deve</strong> fazer, dizer ou assuntos que deve evitar.</p>
              </div>
            </div>
            <textarea
              id="prompt-negativo"
              value={config.negative_prompt}
              onChange={(e) => update({ negative_prompt: e.target.value })}
              placeholder="Ex: Nunca invente informações sobre produtos. Não fale sobre concorrentes. Não prometa prazos que não estão confirmados. Não discuta política ou religião..."
              className="min-h-[180px] w-full rounded-lg border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-y"
            />
          </section>
        </div>
      </div>

      {/* ── Base de Produtos (Upload) ── */}
      <section className="mb-6 rounded-xl border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 text-lg">📦</span>
            <div>
              <h2 className="font-semibold text-gray-900">Catálogo de Produtos</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Faça upload da planilha Excel com seus produtos (descrição, características, preço, etc.). O agente vai consultar essa base para responder os clientes.
              </p>
              <p className="text-xs text-purple-600 mt-1 font-semibold">
                💡 Dica: Planilhas Excel/CSV enviadas aqui são importadas de forma estruturada no banco de dados.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/products"
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition shadow-sm shrink-0 self-start sm:self-center"
          >
            <span>💰</span> Gerenciar Produtos & Preços
          </Link>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors ${
            dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/40'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-3xl">
            {uploading ? '⏳' : '📊'}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {uploading ? 'Processando...' : 'Arraste sua planilha aqui ou clique para selecionar'}
            </p>
            <p className="mt-1 text-xs text-gray-400">Excel (.xlsx, .xls), CSV ou TXT • Máx. 10MB</p>
          </div>
          {!uploading && (
            <button
              type="button"
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition pointer-events-none"
            >
              Selecionar arquivo
            </button>
          )}
        </div>

        {uploadStatus && (
          <div className="mt-3">
            <p className={`text-sm font-medium ${uploadStatus.startsWith('✅') ? 'text-green-700' : uploadStatus.startsWith('❌') ? 'text-red-600' : 'text-blue-600'}`}>
              {uploadStatus}
            </p>
            {uploadStatus.includes('importado') && (
              <p className="mt-1 text-xs text-gray-500">
                Você pode visualizar, gerenciar ou cadastrar manualmente estes produtos na página de{' '}
                <Link href="/dashboard/products" className="text-purple-600 hover:underline font-bold">
                  Catálogo de Produtos
                </Link>.
              </p>
            )}
          </div>
        )}

        {/* Arquivos já enviados */}
        {kbFiles.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Arquivos indexados</h3>
            <div className="space-y-2">
              {kbFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.file_name}</p>
                    <p className="text-xs text-gray-400">
                      {f.chunk_count ? `${f.chunk_count} trechos` : ''} · {new Date(f.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">indexado</span>

                  {/* Confirmação / botão excluir */}
                  {confirmDeleteId === f.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-red-600 font-medium">Confirmar?</span>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
                      >
                        {deletingId === f.id ? '...' : 'Sim, excluir'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(f.id)}
                      title="Excluir arquivo"
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Configurações técnicas ── */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Modelo de IA</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Provedor</span>
              <select
                value={config.llm_provider}
                onChange={(e) => update({ llm_provider: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="openai">OpenAI</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Modelo</span>
              <select
                value={config.model_name}
                onChange={(e) => update({ model_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o mini</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Chave de API OpenAI (Opcional)</span>
              <input
                type="password"
                value={config.api_key}
                onChange={(e) => update({ api_key: e.target.value })}
                placeholder="sk-proj-..."
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0084c7] focus:ring-2 focus:ring-[#0084c7]/10"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Insira seu próprio token OpenAI para que o robô use seus créditos.</span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Temperatura: {config.temperature}</span>
              <input
                type="range" min="0" max="1.5" step="0.1"
                value={config.temperature}
                onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
                className="mt-2 w-full accent-[#0084c7]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Preciso</span><span>Criativo</span>
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Limite de tokens por resposta</span>
              <input
                type="number" min={120} max={2000}
                value={config.max_tokens}
                onChange={(e) => update({ max_tokens: parseInt(e.target.value) || 800 })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Base de conhecimento (RAG)</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-gray-800">Usar arquivos e contexto</span>
                <span className="block text-xs text-gray-500">Quando houver base indexada, o agente consulta antes de responder.</span>
              </span>
              <input
                type="checkbox"
                checked={config.rag_enabled}
                onChange={(e) => update({ rag_enabled: e.target.checked })}
                className="h-5 w-5 accent-[#0084c7]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-sm font-medium text-gray-700">Top K (trechos)</span>
                <input
                  type="number" min={1} max={10}
                  value={config.rag_top_k}
                  onChange={(e) => update({ rag_top_k: parseInt(e.target.value) || 3 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">Precisão mín.</span>
                <input
                  type="number" min={0} max={1} step={0.05}
                  value={config.rag_threshold}
                  onChange={(e) => update({ rag_threshold: parseFloat(e.target.value) || 0.75 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* ── Salvar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#0084c7] px-8 py-3 font-semibold text-white transition hover:bg-[#0070b0] disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar configuração'}
        </button>
        {status && (
          <p className={`text-sm font-medium ${status.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
