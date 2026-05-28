'use client';

import { useEffect, useState } from 'react';

interface EvoInstance {
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profilePicUrl: string;
  instanceId: string;
}

export default function DashboardPage() {
  const [instance, setInstance] = useState<EvoInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [qrcode, setQrcode] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/evolution/manage');
      const d = await r.json();
      if (d.instance) setInstance(d.instance);
      else setInstance(null);
    } catch { setInstance(null); }
    setLoading(false);
  };

  useEffect(() => { checkStatus(); }, []);

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
  };

  const phoneNumber = instance?.ownerJid?.replace(/@s\.whatsapp\.net$/, '') || '';
  const formattedPhone = phoneNumber ? `+${phoneNumber}` : '';
  const isConnected = instance?.connectionStatus === 'open';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
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
        <div className="p-4 border-b">
          <h2 className="font-semibold">Todas as Conversas</h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p className="text-4xl mb-4">💬</p>
          <p>Nenhuma conversa ainda.</p>
          <p className="text-sm mt-2">
            {isConnected
              ? 'As mensagens aparecerao aqui automaticamente quando seus clientes enviarem.'
              : 'Conecte seu WhatsApp para comecar a receber mensagens.'}
          </p>
        </div>
      </div>
    </div>
  );
}
