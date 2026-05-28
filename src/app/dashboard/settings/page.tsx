'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    tenantName: 'Minha Empresa',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    evolutionWebhookUrl: 'https://evolution.minhaempresa.com:3000',
    metaAppId: '123456789',
    stripeKey: 'sk_live_...'
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">⚙️ Configurações</h1>

      {/* General */}
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
              <option value="America/Belem">América/Belém (GMT-3)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
            <select value={settings.language} className="w-full border rounded-lg px-3 py-2">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evolution API */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">🔌 Integrações</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evolution API Webhook URL</label>
            <input type="text" value={settings.evolutionWebhookUrl} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" />
            <p className="text-xs text-gray-500 mt-1">URL do servidor Evolution API na Hostinger</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta App ID</label>
            <input type="text" value={settings.metaAppId} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">💳 Assinatura</h2>
        <div className="flex justify-between items-center pb-4 border-b mb-4">
          <div>
            <p className="font-medium">Plano Professional</p>
            <p className="text-sm text-gray-500">R$ 297/mês • Próxima cobrança em 01/04/2024</p>
          </div>
          <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Gerenciar</button>
        </div>
        <div className="flex gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">Trocar Plano</button>
          <button className="border border-red-300 text-red-600 px-6 py-2 rounded-lg text-sm hover:bg-red-50">Cancelar Assinatura</button>
        </div>
      </div>

      <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
        💾 Salvar Configurações
      </button>
    </div>
  );
}
