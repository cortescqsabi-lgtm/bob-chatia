'use client';

import { useState } from 'react';

interface Conversation {
  id: string;
  contact_name: string;
  message: string;
  time: string;
  unread: number;
  channel: string;
}

export default function ChatInterface() {
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const conversations: Conversation[] = [
    { id: '1', contact_name: 'João Silva', message: 'Olá! Quero saber sobre o produto X', time: '14:30', unread: 2, channel: '📱' },
    { id: '2', contact_name: 'Maria Souza', message: 'Obrigado pelo atendimento!', time: '14:15', unread: 1, channel: '📸' },
    { id: '3', contact_name: 'Carlos Lima', message: 'Ainda está disponível?', time: '13:45', unread: 0, channel: '📱' },
  ];

  const messages = [
    { role: 'user', content: 'Olá! Quero saber sobre o produto X', time: '14:30' },
    { role: 'assistant', content: 'Olá! O produto X custa R$ 199,90 e tem entrega em 3-5 dias úteis. Como posso ajudar?', time: '14:30', ai: true },
    { role: 'user', content: 'Tem desconto para pagamento à vista?', time: '14:31' },
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg border overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r overflow-y-auto">
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Buscar conversas..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => setActiveConv(conv.id)}
            className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${activeConv === conv.id ? 'bg-blue-50' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span>{conv.channel}</span>
                <span className="font-medium text-sm">{conv.contact_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{conv.time}</span>
                {conv.unread > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 truncate mt-1">{conv.message}</p>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-3 border-b bg-gray-50">
              <p className="font-medium">João Silva</p>
              <p className="text-xs text-gray-500">WhatsApp • Online</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : msg.ai ? 'bg-purple-50 border' : 'bg-gray-100'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    {msg.ai && <span className="text-xs text-purple-500 mt-1 block">🤖 IA</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Enviar
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                  🤖 IA
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-6xl mb-4">💬</p>
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
