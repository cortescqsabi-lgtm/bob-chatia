'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    tenantName: 'BOB CHATia',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR'
  });
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/conversations?type=channels')
      .then(r => r.json())
      .then(d => { if (d.data) setChannels(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connectMeta = (provider: string) => {
    const tenantId = '00000000-0000-0000-0000-000000000001';
    window.location.href = `/api/meta/oauth?tenant_id=${tenantId}&provider=${provider}`;
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('meta_connected') === 'ok' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Redes sociais conectadas com sucesso!
        </div>
      )}

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Geral</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
            <input type="text" value={settings.tenantName} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuso Horário</label>
            <select value={settings.timezone} className="w-full border rounded-lg px-3 py-2">
              <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
              <option value="America/Manaus">América/Manaus (GMT-4)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
            <select value={settings.language} className="w-full border rounded-lg px-3 py-2">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Canais Conectados</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {channels.length === 0 && (
              <p className="text-gray-500 text-sm">Nenhum canal conectado ainda.</p>
            )}
            {channels.map((ch: any) => (
              <div key={ch.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${ch.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="font-medium">{ch.channel_name || ch.provider}</span>
                  <span className="text-sm text-gray-500">{ch.provider === 'whatsapp' ? 'WhatsApp' : ch.provider === 'instagram' ? 'Instagram' : 'Facebook'}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${ch.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {ch.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Conectar Nova Rede Social</h2>
        <p className="text-sm text-gray-500 mb-4">Conecte suas redes sociais para receber mensagens diretamente no BOB CHATia.</p>
        <div className="flex gap-4">
          <button onClick={() => connectMeta('instagram')} className="flex items-center gap-2 border-2 border-pink-500 text-pink-600 px-6 py-3 rounded-lg hover:bg-pink-50 font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            Instagram
          </button>
          <button onClick={() => connectMeta('facebook')} className="flex items-center gap-2 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook Messenger
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Assinatura</h2>
        <div className="flex justify-between items-center pb-4 border-b mb-4">
          <div>
            <p className="font-medium">Plano Professional</p>
            <p className="text-sm text-gray-500">R$ 297/mês</p>
          </div>
          <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Gerenciar</button>
        </div>
        <div className="flex gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">Trocar Plano</button>
          <button className="border border-red-300 text-red-600 px-6 py-2 rounded-lg text-sm hover:bg-red-50">Cancelar Assinatura</button>
        </div>
      </div>
    </div>
  );
}
