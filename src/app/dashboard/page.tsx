'use client';

import { useEffect, useState, useCallback } from 'react';

interface EvoInstance {
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profilePicUrl: string;
  instanceId: string;
}

interface Conversation {
  id: string;
  channel_identifier: string;
  contact_name: string | null;
  last_message_at: string;
  status: string;
  channel_type: string;
}

interface Message {
  id: string;
  content: string;
  role: string;
  created_at: string;
}

export default function DashboardPage() {
  const [instance, setInstance] = useState<EvoInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/evolution/manage');
      const d = await r.json();
      setInstance(d.instance || null);
    } catch { setInstance(null); }
    setLoading(false);
  };

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const r = await fetch('/api/crm/conversations');
      const d = await r.json();
      setConversations(d.data || []);
    } catch { setConversations([]); }
    setConversationsLoading(false);
  }, []);

  const loadMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const r = await fetch(`/api/crm/messages?conversation_id=${convId}`);
      const d = await r.json();
      setMessages(d.data || []);
    } catch { setMessages([]); }
    setMessagesLoading(false);
  };

  useEffect(() => { checkStatus(); loadConversations(); }, [loadConversations]);

  const handleConnect = async () => {
    setConnecting(true);
    setQrcode(null);
    try {
      const r = await fetch('/api/evolution/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      });
      const d = await r.json();
      if (d.connected) {
        await checkStatus();
        await loadConversations();
      } else if (d.qrcode) {
        setQrcode(d.qrcode);
      }
    } catch (e) { console.error(e); }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    await fetch('/api/evolution/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect' })
    });
    setInstance(null);
    setQrcode(null);
    setSelectedConv(null);
    setMessages([]);
    await loadConversations();
  };

  const phoneNumber = instance?.ownerJid?.replace(/@s\.whatsapp\.net$/, '') || '';
  const formattedPhone = phoneNumber ? `+${phoneNumber}` : '';
  const isConnected = instance?.connectionStatus === 'open';

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 13) return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`;
    if (digits.length === 12) return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4,8)}-${digits.slice(8)}`;
    return raw;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (selectedConv) {
    return (
      <div>
        <button onClick={() => { setSelectedConv(null); setMessages([]); }}
          className="text-sm text-blue-600 hover:underline mb-4 block">&larr; Voltar para conversas</button>
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">{selectedConv.contact_name || formatPhone(selectedConv.channel_identifier)}</h2>
            <p className="text-xs text-gray-400">{selectedConv.channel_identifier}</p>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {messagesLoading ? (
              <p className="text-gray-400 text-center py-8">Carregando mensagens...</p>
            ) : messages.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhuma mensagem encontrada.</p>
            ) : (
              [...messages].reverse().map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${m.role === 'user' ? 'bg-gray-100 text-gray-800' : 'bg-blue-500 text-white'}`}>
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-gray-400' : 'text-blue-100'}`}>{formatTime(m.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conversas</h1>

      {/* WhatsApp Status */}
      <div className={`rounded-lg border p-6 mb-6 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div>
              <p className="font-semibold">WhatsApp</p>
              <p className="text-sm text-gray-600">
                {isConnected ? `Conectado ${formattedPhone}` : 'Desconectado'}
              </p>
            </div>
            {isConnected && instance?.profilePicUrl && (
              <img src={instance.profilePicUrl} alt="" className="w-10 h-10 rounded-full" />
            )}
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {connecting ? 'Conectando...' : 'Conectar WhatsApp'}
              </button>
            )}
          </div>
        </div>

        {!isConnected && !connecting && (
          <p className="text-sm text-gray-500 mt-3">
            Clique em &quot;Conectar WhatsApp&quot; para gerar o QR code.
          </p>
        )}

        {connecting && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            Criando instancia e gerando QR code...
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrcode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setQrcode(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Conectar WhatsApp</h3>
            <p className="text-sm text-gray-500 mb-4">
              Abra o WhatsApp no celular &gt; Configurações &gt; Conectar dispositivo e escaneie o QR code abaixo.
            </p>
            <img src={qrcode} alt="QR Code WhatsApp" className="w-full rounded-lg border" />
            <p className="text-xs text-gray-400 mt-3 text-center">
              O QR code expira em alguns minutos. Após escanear, a página será atualizada automaticamente.
            </p>
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={handleConnect}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Gerar novo QR code
              </button>
              <button
                onClick={() => setQrcode(null)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'WhatsApp', value: isConnected ? 'Conectado' : 'Desconectado', color: isConnected ? 'bg-green-500' : 'bg-gray-400' },
          { label: 'Instagram', value: 'Nao configurado', color: 'bg-gray-300' },
          { label: 'Facebook', value: 'Nao configurado', color: 'bg-gray-300' },
          { label: 'IA', value: 'Ativa', color: 'bg-purple-500' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <span className="text-gray-600 text-sm">{stat.label}</span>
            </div>
            <p className="text-lg font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Conversations */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Todas as Conversas</h2>
          <span className="text-xs text-gray-400">{conversations.length} conversas</span>
        </div>
        {conversationsLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando conversas...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">💬</p>
            <p>Nenhuma conversa ainda.</p>
            <p className="text-sm mt-2">
              {isConnected
                ? 'As mensagens aparecerao aqui automaticamente quando seus clientes enviarem.'
                : 'Conecte seu WhatsApp para comecar a receber mensagens.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <button key={conv.id}
                onClick={() => { setSelectedConv(conv); loadMessages(conv.id); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                  {(conv.contact_name || conv.channel_identifier).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conv.contact_name || formatPhone(conv.channel_identifier)}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.channel_identifier}</p>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{conv.last_message_at ? formatTime(conv.last_message_at) : ''}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
