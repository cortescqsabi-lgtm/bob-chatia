'use client';

import { useEffect, useState } from 'react';

interface Conversation {
  id: string;
  contact_name: string;
  channel_type: string;
  last_message_at: string;
  status: string;
}

interface EvoInstance {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profileName: string | null;
  profilePicUrl: string;
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [evoInstance, setEvoInstance] = useState<EvoInstance | null>(null);
  const [evoLoading, setEvoLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/conversations')
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.data || []);
        setLoading(false);
      });

    fetch('/api/evolution/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.instances && data.instances.length > 0) {
          setEvoInstance(data.instances[0]);
        }
        setEvoLoading(false);
      })
      .catch(() => setEvoLoading(false));
  }, []);

  const phoneNumber = evoInstance?.ownerJid?.replace(/@s\.whatsapp\.net$/, '') || '';
  const formattedPhone = phoneNumber ? `+${phoneNumber}` : '';
  const isConnected = evoInstance?.connectionStatus === 'open';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conversas</h1>

      {/* WhatsApp Status Card */}
      <div className={`rounded-lg border p-4 mb-6 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-sm text-gray-600">
                {evoLoading ? 'Verificando...' : isConnected ? `Conectado ${formattedPhone}` : 'Desconectado'}
              </p>
            </div>
            {isConnected && evoInstance?.profilePicUrl && (
              <img src={evoInstance.profilePicUrl} alt="" className="w-10 h-10 rounded-full" />
            )}
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <a
                href="https://b2zap-evolution-api.yagj5r.easypanel.host/manager"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50"
              >
                Desconectar
              </a>
            ) : (
              <a
                href="https://b2zap-evolution-api.yagj5r.easypanel.host/manager"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
              >
                Conectar WhatsApp
              </a>
            )}
          </div>
        </div>
        {!isConnected && !evoLoading && (
          <p className="text-sm text-yellow-700 mt-2">
            Clique em &quot;Conectar WhatsApp&quot; para escanear o QR code no Evolution Manager.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Conversas Ativas', value: conversations.filter(c => c.status === 'active').length.toString(), color: 'bg-blue-500' },
          { label: 'Mensagens Hoje', value: '0', color: 'bg-green-500' },
          { label: 'WhatsApp', value: isConnected ? 'Conectado' : 'Offline', color: isConnected ? 'bg-green-500' : 'bg-yellow-500' },
          { label: 'IA Ativa', value: 'Online', color: 'bg-purple-500' }
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

      {/* Conversations */}
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
            <input type="text" placeholder="Buscar..." className="border rounded px-3 py-1 text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">💬</p>
            <p>Nenhuma conversa ainda.</p>
            <p className="text-sm mt-2">As mensagens aparecerão aqui automaticamente quando seus clientes enviarem.</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <div key={conv.id} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                <div>
                  <p className="font-medium">{conv.contact_name || 'Contato'}</p>
                  <p className="text-sm text-gray-500">{conv.channel_type} - {conv.status}</p>
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
