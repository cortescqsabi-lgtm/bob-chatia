'use client';

import { useEffect, useState } from 'react';

interface Conversation {
  id: string;
  contact_name: string;
  channel_type: string;
  last_message_at: string;
  status: string;
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/conversations')
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">💬 Conversas</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Conversas Ativas', value: '45', color: 'bg-blue-500' },
          { label: 'Mensagens Hoje', value: '189', color: 'bg-green-500' },
          { label: 'Resolvidas', value: '23', color: 'bg-purple-500' },
          { label: 'Pendentes', value: '12', color: 'bg-orange-500' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <span className="text-gray-600 text-sm">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Todas as Conversas</h2>
          <div className="flex gap-2">
            <select className="border rounded px-3 py-1 text-sm">
              <option>Todos os canais</option>
              <option>WhatsApp</option>
              <option>Instagram</option>
              <option>Facebook</option>
            </select>
            <input
              type="text"
              placeholder="Buscar..."
              className="border rounded px-3 py-1 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">💬</p>
            <p>Nenhuma conversa ainda.</p>
            <p className="text-sm mt-2">Conecte seu WhatsApp via Evolution API para começar.</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <div key={conv.id} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                <div>
                  <p className="font-medium">{conv.contact_name || 'Contato Desconhecido'}</p>
                  <p className="text-sm text-gray-500">{conv.channel_type} • {conv.status}</p>
                </div>
                <span className="text-xs text-gray-400">{conv.last_message_at}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
