'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface EvoInstance {
  name: string; connectionStatus: string; ownerJid: string;
  profilePicUrl: string; instanceId: string;
}
interface Conversation {
  id: string; channel_identifier: string; contact_name: string | null;
  last_message_at: string; status: string; channel_type: string;
}
interface Message {
  id: string; content: string; role: string; created_at: string; direction?: string;
}

const svg = {
  atendimento: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  kanban: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>',
  tarefas: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  respostas: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  contatos: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  agendamentos: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  tags: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  resultados: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  ajuda: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  emoji: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  attach: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  filter: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
};

function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: svg[name as keyof typeof svg] || '' }} />;
}

const menuItems = [
  { key: 'atendimento', label: 'Atendimento', icon: 'atendimento' },
  { key: 'kanban', label: 'Kanban', icon: 'kanban' },
  { key: 'tarefas', label: 'Tarefas', icon: 'tarefas' },
  { key: 'respostas', label: 'Respostas Rápidas', icon: 'respostas' },
  { key: 'contatos', label: 'Contatos', icon: 'contatos' },
  { key: 'agendamentos', label: 'Agendamentos', icon: 'agendamentos' },
  { key: 'tags', label: 'Tags', icon: 'tags' },
  { key: 'chat', label: 'Chat Interno', icon: 'chat' },
  { key: 'resultados', label: 'Resultados', icon: 'resultados' },
  { key: 'ajuda', label: 'Ajuda', icon: 'ajuda' },
];

const tagColors: Record<string, string> = {
  'vendas': 'bg-purple-100 text-purple-700',
  'suporte': 'bg-amber-100 text-amber-700',
  'orcamento': 'bg-cyan-100 text-cyan-700',
  'reclamacao': 'bg-red-100 text-red-700',
  'lead': 'bg-green-100 text-green-700',
};

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`;
  return raw;
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800) return 'ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function CrmPage() {
  const [activeMenu, setActiveMenu] = useState('atendimento');
  const [instance, setInstance] = useState<EvoInstance | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [tab, setTab] = useState<'abertas' | 'resolvidos'>('abertas');
  const [subtab, setSubtab] = useState<'atendendo' | 'aguardando'>('aguardando');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = useCallback(async () => {
    setLoadingConv(true);
    try {
      const r = await fetch('/api/crm/conversations');
      const d = await r.json();
      setConversations(d.data || []);
    } catch { setConversations([]); }
    setLoadingConv(false);
  }, []);

  useEffect(() => {
    fetch('/api/evolution/manage').then(r => r.json()).then(d => setInstance(d.instance || null)).catch(() => {});
    loadConversations();
  }, [loadConversations]);

  const loadMessages = async (convId: string) => {
    setLoadingMsg(true);
    try {
      const r = await fetch(`/api/crm/messages?conversation_id=${convId}`);
      const d = await r.json();
      setMessages(d.data || []);
    } catch { setMessages([]); }
    setLoadingMsg(false);
  };

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    loadMessages(conv.id);
    setShowMobileList(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedConv) return;
    const text = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: 'sending', content: text, role: 'assistant', created_at: new Date().toISOString(), direction: 'outgoing' }]);
    try {
      const r = await fetch('/api/crm/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConv.id, content: text, type: 'text' })
      });
      if (r.ok) loadMessages(selectedConv.id);
    } catch {}
  };

  const filteredConversations = conversations.filter(c => {
    if (tab === 'resolvidos') return c.status === 'resolved';
    return c.status !== 'resolved';
  }).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.contact_name || '').toLowerCase().includes(q) || c.channel_identifier.includes(q);
  });

  return (
    <div className="flex h-screen bg-[#f4f5f7]" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* === Sidebar === */}
      <aside className="hidden md:flex flex-col items-center w-[68px] bg-white border-r border-gray-100 py-4 flex-shrink-0">
        <div className="w-9 h-9 bg-[#0084c7] rounded-lg flex items-center justify-center text-white font-bold text-sm mb-6">B</div>
        <nav className="flex flex-col items-center gap-1 flex-1">
          {menuItems.map(item => (
            <button key={item.key} onClick={() => setActiveMenu(item.key)}
              className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeMenu === item.key ? 'bg-blue-50 text-[#0084c7]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              title={item.label}>
              {activeMenu === item.key && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0084c7] rounded-r-full" />}
              <Icon name={item.icon} size={20} />
            </button>
          ))}
        </nav>
      </aside>

      {/* === Conversation List === */}
      <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex flex-col w-[380px] bg-white border-r border-gray-100 flex-shrink-0`}>
        {/* Welcome bar */}
        <div className="bg-[#0084c7] px-5 py-4">
          <p className="text-white/90 text-xs font-medium uppercase tracking-wider">Bem-vindo(a) à</p>
          <p className="text-white font-semibold text-lg leading-tight">BOB CHATia</p>
        </div>

        {/* Tabs + actions */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              {['abertas', 'resolvidos'].map(t => (
                <button key={t} onClick={() => { setTab(t as any); setSelectedConv(null); setMessages([]); }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${tab === t ? 'bg-[#e8f0fe] text-[#0084c7]' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'abertas' ? `ABERTAS (${conversations.filter(c => c.status !== 'resolved').length})` : 'RESOLVIDOS'}
                </button>
              ))}
            </div>
            <button className="text-xs font-semibold text-gray-500 hover:text-gray-700 mr-1" onClick={() => setSearch('')}>BUSCA</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs font-semibold text-[#0084c7] border border-[#0084c7] rounded-lg px-3 py-1.5 hover:bg-blue-50 transition">
              <Icon name="plus" size={14} /> NOVO
            </button>
            <div className="flex items-center gap-1 text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <Icon name="filter" size={14} /> <span>Filas</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-medium text-gray-400">Todos</span>
              <div className="w-8 h-4 bg-[#0084c7] rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex border-b border-gray-100">
          {['atendendo', 'aguardando'].map(s => (
            <button key={s} onClick={() => setSubtab(s as any)}
              className={`flex-1 text-center text-xs font-semibold py-2.5 transition relative ${subtab === s ? 'text-[#0084c7]' : 'text-gray-400 hover:text-gray-600'}`}>
              {s === 'atendendo' ? 'ATENDENDO' : 'AGUARDANDO'}
              {subtab === s && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#0084c7] rounded-full" />}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input type="text" placeholder="Pesquisar conversa..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#0084c7]/20 placeholder:text-gray-300" />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {loadingConv ? (
            <div className="text-center text-gray-400 text-sm py-12">Carregando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-12">Nenhuma conversa encontrada</div>
          ) : filteredConversations.map(conv => (
            <button key={conv.id} onClick={() => handleSelectConv(conv)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition border-l-[3px] ${selectedConv?.id === conv.id ? 'border-l-[#0084c7] bg-blue-50/30' : 'border-l-transparent'}`}>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {(conv.contact_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-800 truncate">{conv.contact_name || formatPhone(conv.channel_identifier)}</p>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                </div>
                <p className="text-[13px] text-gray-500 truncate mt-0.5">{conv.channel_identifier}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">vendas</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <span className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">3</span>
                <div className="flex gap-1">
                  <Icon name="check" size={14} className="text-green-500 opacity-60" />
                  <Icon name="eye" size={14} className="text-blue-400 opacity-60" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* === Chat Area === */}
      <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-[#f4f5f7]`}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="atendimento" size={36} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Selecione um ticket</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Escolha uma conversa na lista ao lado para começar a atender
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
              <button className="md:hidden mr-1 text-gray-500" onClick={() => { setShowMobileList(true); setSelectedConv(null); }}>
                <Icon name="back" size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {(selectedConv.contact_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{selectedConv.contact_name || formatPhone(selectedConv.channel_identifier)}</p>
                <p className="text-xs text-green-600 font-medium">Online</p>
              </div>
              <div className="flex items-center gap-1">
                {['phone', 'video', 'info', 'more'].map(icon => (
                  <button key={icon} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                    <Icon name={icon} size={19} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 scroll-smooth" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e4e9 1px, transparent 0)', backgroundSize: '20px 20px' }}>
              {loadingMsg ? (
                <div className="text-center text-gray-400 text-sm py-12">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-12">Nenhuma mensagem ainda</div>
              ) : (
                [...messages].reverse().map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.role === 'user' || m.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' || m.direction === 'incoming' ? 'bg-white text-gray-800 shadow-sm' : 'bg-[#0084c7] text-white'} rounded-2xl ${m.role === 'user' || m.direction === 'incoming' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1.5 ${m.role === 'user' || m.direction === 'incoming' ? 'text-gray-400' : 'text-blue-200'}`}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-5 py-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-1.5">
                <button className="text-gray-400 hover:text-gray-600 transition p-1">
                  <Icon name="emoji" size={20} />
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition p-1">
                  <Icon name="attach" size={20} />
                </button>
                <input type="text" placeholder="Digite sua mensagem..." value={inputText} onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1 bg-transparent text-sm outline-none py-1.5 px-2 placeholder:text-gray-300" />
                <button onClick={handleSend}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition ${inputText.trim() ? 'bg-[#0084c7] text-white shadow-sm hover:bg-[#0070b0]' : 'bg-gray-200 text-gray-400'}`}>
                  <Icon name="send" size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
