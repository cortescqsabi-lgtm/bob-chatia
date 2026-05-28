'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/* ─── Types ─── */
interface Tag { id: string; name: string; color: string; }
interface Conversation { id: string; channel_identifier: string; contact_name: string | null; last_message_at: string; status: string; channel_type: string; }
interface Message { id: string; content: string; role: string; created_at: string; direction?: string; }

/* ─── SVG Icons ─── */
const S: Record<string,string> = {
  atendimento:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  kanban:'<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>',
  tarefas:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  respostas:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  contatos:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  agendamentos:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  tags:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  resultados:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  ajuda:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  check:'<polyline points="20 6 9 17 4 12"/>',
  eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  send:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  emoji:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  attach:'<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  video:'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  info:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  back:'<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  filter:'<line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
};
function Icon({ n, s = 20, c = '' }: { n: string; s?: number; c?: string }) {
  return <svg className={c} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: S[n]||'' }} />;
}

const menuItems = [
  { k: 'atendimento', l: 'Atendimento' }, { k: 'kanban', l: 'Kanban' },
  { k: 'tarefas', l: 'Tarefas' }, { k: 'respostas', l: 'Respostas Rápidas' },
  { k: 'contatos', l: 'Contatos' }, { k: 'agendamentos', l: 'Agendamentos' },
  { k: 'tags', l: 'Tags' }, { k: 'chat', l: 'Chat Interno' },
  { k: 'resultados', l: 'Resultados' }, { k: 'ajuda', l: 'Ajuda' },
];

function fmtPhone(r: string) { const d = r.replace(/\D/g,''); if(d.length===13)return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`; if(d.length===12)return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`; return r; }
function fmtTime(iso: string) { if(!iso)return''; const d=new Date(iso), n=new Date(), df=(n.getTime()-d.getTime())/1000; if(df<60)return'agora'; if(df<3600)return Math.floor(df/60)+'min'; if(df<86400)return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); if(df<172800)return'ontem'; return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}); }

export default function CrmPage() {
  const [menu, setMenu] = useState('atendimento');
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [sel, setSel] = useState<Conversation|null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [convTags, setConvTags] = useState<Record<string,Tag[]>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'abertas'|'resolvidos'>('abertas');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [mobile, setMobile] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const [tagModal, setTagModal] = useState(false);
  const [editTag, setEditTag] = useState<Tag|null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#6366f1');
  const [showTagPicker, setShowTagPicker] = useState<string|null>(null);

  const loadTags = useCallback(async () => {
    try { const r=await fetch('/api/tags'); const d=await r.json(); setTags(d.data||[]); } catch {}
  }, []);

  const loadAllConvTags = useCallback(async () => {
    try {
      const r=await fetch('/api/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get_all_tags'})});
      const d=await r.json();
      if (d.data) setConvTags(d.data);
    } catch {}
  }, []);

  const loadConvs = useCallback(async () => {
    setLoading(true);
    try { const r=await fetch('/api/crm/conversations'); const d=await r.json(); setConvs(d.data||[]); } catch { setConvs([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadConvs(); loadTags(); loadAllConvTags(); }, [loadConvs, loadTags, loadAllConvTags]);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);

  const loadMsgs = async (id: string) => {
    try { const r=await fetch('/api/crm/messages?conversation_id='+id); const d=await r.json(); setMsgs(d.data||[]); } catch { setMsgs([]); }
  };

  const loadSingleConvTags = async (convId: string) => {
    try { const r=await fetch('/api/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get_tags',conversation_id:convId})}); const d=await r.json(); setConvTags(p=>({...p,[convId]:d.data||[]})); } catch {}
  };

  const handleSelect = (c: Conversation) => { setSel(c); loadMsgs(c.id); loadSingleConvTags(c.id); setMobile(false); };

  const handleSend = async () => {
    if(!input.trim()||!sel)return;
    const t=input.trim(); setInput(''); setMsgs(p=>[...p,{id:'sending',content:t,role:'assistant',created_at:new Date().toISOString(),direction:'outgoing'}]);
    const r=await fetch('/api/crm/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation_id:sel.id,content:t,type:'text'})});
    if(!r.ok) setMsgs(p=>p.filter(m=>m.id!=='sending'));
    loadMsgs(sel.id);
  };

  const handleSaveTag = async () => {
    if(!tagName.trim())return;
    if(editTag) {
      await fetch('/api/tags/'+editTag.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:tagName,color:tagColor})});
    } else {
      await fetch('/api/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:tagName,color:tagColor})});
    }
    setTagModal(false); setEditTag(null); setTagName(''); setTagColor('#6366f1'); loadTags();
  };

  const handleDeleteTag = async (id: string) => {
    await fetch('/api/tags/'+id,{method:'DELETE'}); loadTags();
  };

  const handleAssignTag = async (convId: string, tagId: string) => {
    await fetch('/api/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'assign',conversation_id:convId,tag_id:tagId})});
    loadAllConvTags();
  };

  const handleUnassignTag = async (convId: string, tagId: string) => {
    await fetch('/api/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'unassign',conversation_id:convId,tag_id:tagId})});
    loadAllConvTags();
  };

  const [dragId, setDragId] = useState<string|null>(null);
  const [popupConv, setPopupConv] = useState<Conversation|null>(null);
  const [popupMsgs, setPopupMsgs] = useState<Message[]>([]);
  const [subtab, setSubtab] = useState<'aguardando'|'atendendo'>('aguardando');

  const handleAccept = async (c: Conversation) => {
    await fetch('/api/crm/conversations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status: 'attending' }) });
    loadConvs();
  };

  const handlePopup = async (c: Conversation) => {
    setPopupConv(c);
    try { const r=await fetch('/api/crm/messages?conversation_id='+c.id); const d=await r.json(); setPopupMsgs(d.data||[]); } catch { setPopupMsgs([]); }
  };

  const handleDrop = async (convId: string, targetTagId: string|null) => {
    const conv = convs.find(c => c.id === convId);
    if (!conv) return;
    const currentTags = convTags[convId] || [];
    if (targetTagId) {
      if (!currentTags.some(t => t.id === targetTagId)) {
        await handleAssignTag(convId, targetTagId);
      }
      for (const t of currentTags) {
        if (t.id !== targetTagId) await handleUnassignTag(convId, t.id);
      }
      setConvTags(p => ({...p, [convId]: [tags.find(t=>t.id===targetTagId)!]}));
    } else {
      for (const t of currentTags) await handleUnassignTag(convId, t.id);
      setConvTags(p => ({...p, [convId]: []}));
    }
    setDragId(null);
  };

  /* ─── Kanban data ─── */
  const kanbanCols = tags.map(t => ({ tag: t, convs: convs.filter(c => (convTags[c.id]||[]).some(ct => ct.id === t.id)) }));
  const untagged = convs.filter(c => !(convTags[c.id]||[]).length);

  /* ─── Render ─── */
  const convsAbertas = convs.filter(c => c.status !== 'resolved' && c.status !== 'archived' && c.status !== 'blocked');
  const convsResolvidas = convs.filter(c => c.status === 'resolved');
  const baseList = tab === 'resolvidos' ? convsResolvidas : convsAbertas;
  const filtered = baseList.filter(c => {
    if(tab === 'resolvidos') return true;
    if(subtab === 'atendendo') return c.status === 'attending';
    return c.status === 'waiting' || c.status === 'active';
  }).filter(c => {
    if(!search)return true;
    const q=search.toLowerCase();
    return (c.contact_name||'').toLowerCase().includes(q)||c.channel_identifier.includes(q);
  });

  return (
    <div className="flex h-screen bg-[#f4f5f7]" style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      {/* ─── SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col items-center w-[68px] bg-white border-r border-gray-100 py-4 flex-shrink-0">
        <div className="w-9 h-9 bg-[#0084c7] rounded-lg flex items-center justify-center text-white font-bold text-sm mb-6">B</div>
        <nav className="flex flex-col items-center gap-1 flex-1">
          {menuItems.map(m => (
            <button key={m.k} onClick={() => setMenu(m.k)}
              className={'relative w-12 h-12 flex items-center justify-center rounded-xl transition '+(menu===m.k?'bg-blue-50 text-[#0084c7]':'text-gray-400 hover:text-gray-600 hover:bg-gray-50')}
              title={m.l}>
              {menu===m.k && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0084c7] rounded-r-full" />}
              <Icon n={m.k} s={20} />
            </button>
          ))}
        </nav>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ ATENDIMENTO ═══ */}
        {menu === 'atendimento' && <>
          {/* Conversation List */}
          <div className={(mobile?'flex':'hidden')+' md:flex flex-col w-[380px] bg-white border-r border-gray-100 flex-shrink-0'}>
            <div className="bg-[#0084c7] px-5 py-4">
              <p className="text-white/90 text-xs font-medium uppercase tracking-wider">Bem-vindo(a) à</p>
              <p className="text-white font-semibold text-lg leading-tight">BOB CHATia</p>
            </div>
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1">
                  {['abertas','resolvidos'].map(t => (
                    <button key={t} onClick={() => { setTab(t as any); setSel(null); setMsgs([]); }}
                      className={'text-xs font-semibold px-3 py-1.5 rounded-md transition '+(tab===t?'bg-[#e8f0fe] text-[#0084c7]':'text-gray-500 hover:text-gray-700')}>
                      {t==='abertas'?'ABERTAS ('+convsAbertas.length+')':'RESOLVIDOS ('+convsResolvidas.length+')'}
                    </button>
                  ))}
                </div>
                <button className="text-xs font-semibold text-gray-500" onClick={()=>setSearch('')}>BUSCA</button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs font-semibold text-[#0084c7] border border-[#0084c7] rounded-lg px-3 py-1.5 hover:bg-blue-50 transition"><Icon n="plus" s={14}/> NOVO</button>
                <div className="flex items-center gap-1 text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1.5"><Icon n="filter" s={14}/><span>Filas</span></div>
              </div>
            </div>
            {tab !== 'resolvidos' && (
            <div className="flex border-b border-gray-100">
              {['aguardando','atendendo'].map(s => (
                <button key={s} onClick={() => setSubtab(s as any)}
                  className={'flex-1 text-center text-xs font-semibold py-2.5 transition relative '+(subtab===s?'text-[#0084c7]':'text-gray-400 hover:text-gray-600')}>
                  {s==='aguardando'?'AGUARDANDO ('+convsAbertas.filter(c=>c.status==='waiting'||c.status==='active').length+')':'ATENDENDO ('+convsAbertas.filter(c=>c.status==='attending').length+')'}
                  {subtab===s && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#0084c7] rounded-full" />}
                </button>
              ))}
            </div>
            )}
            <div className="px-4 py-2">
              <div className="relative">
                <Icon n="search" s={15} c="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="text" placeholder="Pesquisar conversa..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#0084c7]/20 placeholder:text-gray-300" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? <div className="text-center text-gray-400 text-sm py-12">Carregando...</div>
              : filtered.length === 0 ? <div className="text-center text-gray-400 text-sm py-12">Nenhuma conversa</div>
              : filtered.map(c => (
                <button key={c.id} onClick={()=>handleSelect(c)}
                  className={'w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition border-l-[3px] '+(sel?.id===c.id?'border-l-[#0084c7] bg-blue-50/30':'border-l-transparent')}>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(c.contact_name||'?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-800 truncate">{c.contact_name||fmtPhone(c.channel_identifier)}</p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{fmtTime(c.last_message_at)}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 truncate mt-0.5">{c.channel_identifier}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {(convTags[c.id]||[]).map(t => (
                        <span key={t.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{backgroundColor:t.color+'20',color:t.color}}>{t.name}</span>
                      ))}
                      <button onClick={e=>{e.stopPropagation();setShowTagPicker(showTagPicker===c.id?null:c.id)}}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-gray-400 border border-dashed border-gray-300 hover:border-gray-400">
                        +tag
                      </button>
                      {showTagPicker===c.id && <div className="absolute z-50 mt-24 bg-white border rounded-lg shadow-lg p-2 w-48" onClick={e=>e.stopPropagation()}>
                        {tags.filter(t=>!(convTags[c.id]||[]).some(ct=>ct.id===t.id)).map(t => (
                          <button key={t.id} onClick={()=>{handleAssignTag(c.id,t.id);setShowTagPicker(null)}}
                            className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{backgroundColor:t.color}} />
                            {t.name}
                          </button>
                        ))}
                        {tags.filter(t=>!(convTags[c.id]||[]).some(ct=>ct.id===t.id)).length===0 && <p className="text-xs text-gray-400 px-2 py-1">Todas as tags já foram adicionadas</p>}
                      </div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    {c.status === 'waiting' || c.status === 'active' ? (
                      <button onClick={e=>{e.stopPropagation();handleAccept(c)}}
                        className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition" title="Aceitar conversa">
                        <Icon n="check" s={12}/>
                      </button>
                    ) : c.status === 'attending' ? (
                      <button onClick={async (e)=>{e.stopPropagation(); await fetch('/api/crm/conversations',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,status:'resolved'})}); loadConvs();}}
                        className="text-[10px] font-semibold border border-green-500 text-green-600 px-1.5 py-0.5 rounded hover:bg-green-50 transition" title="Finalizar atendimento">
                        OK
                      </button>
                    ) : c.status === 'resolved' ? (
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[9px] font-bold flex items-center justify-center">✓</span>
                    ) : null}
                    <button onClick={e=>{e.stopPropagation();handlePopup(c)}}
                      className="text-blue-400 hover:text-blue-600 transition" title="Visualizar sem marcar como lido">
                      <Icon n="eye" s={15}/>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={(!mobile?'flex':'hidden')+' md:flex flex-1 flex-col bg-[#f4f5f7]'}>
            {!sel ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"><Icon n="atendimento" s={36} c="text-gray-400"/></div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Selecione um ticket</h2>
                  <p className="text-sm text-gray-400">Escolha uma conversa ao lado para começar a atender</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
                  <button className="md:hidden mr-1 text-gray-500" onClick={()=>{setMobile(true);setSel(null)}}><Icon n="back" s={20}/></button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(sel.contact_name||'?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{sel.contact_name||fmtPhone(sel.channel_identifier)}</p>
                    <p className="text-xs text-green-600 font-medium">Online</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {sel.status !== 'resolved' && sel.status !== 'archived' && sel.status !== 'blocked' && (
                      <button onClick={async () => {
                        await fetch('/api/crm/conversations',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:sel.id,status:'resolved'})});
                        setSel(null); setMsgs([]); loadConvs();
                      }} className="text-xs font-semibold border border-green-500 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition mr-1">
                        Finalizar
                      </button>
                    )}
                    {['phone','video','info','more'].map(i => (
                      <button key={i} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Icon n={i} s={19}/></button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 scroll-smooth" style={{backgroundImage:'radial-gradient(circle at 1px 1px,#e2e4e9 1px,transparent 0)',backgroundSize:'20px 20px'}}>
                  {msgs.length===0 ? <div className="text-center text-gray-400 text-sm py-12">Nenhuma mensagem ainda</div>
                  : [...msgs].reverse().map((m,i) => (
                    <div key={m.id||i} className={'flex '+(m.role==='user'||m.direction==='incoming'?'justify-start':'justify-end')}>
                      <div className={'max-w-[70%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl '+(m.role==='user'||m.direction==='incoming'?'bg-white text-gray-800 shadow-sm rounded-tl-sm':'bg-[#0084c7] text-white rounded-tr-sm')}>
                        <p>{m.content}</p>
                        <p className={'text-[10px] mt-1.5 '+(m.role==='user'||m.direction==='incoming'?'text-gray-400':'text-blue-200')}>{fmtTime(m.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef}/>
                </div>
                <div className="bg-white border-t border-gray-200 px-5 py-3">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-1.5">
                    <button className="text-gray-400 hover:text-gray-600 p-1"><Icon n="emoji" s={20}/></button>
                    <button className="text-gray-400 hover:text-gray-600 p-1"><Icon n="attach" s={20}/></button>
                    <input type="text" placeholder="Digite sua mensagem..." value={input} onChange={e=>setInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}}
                      className="flex-1 bg-transparent text-sm outline-none py-1.5 px-2 placeholder:text-gray-300" />
                    <button onClick={handleSend}
                      className={'w-9 h-9 rounded-full flex items-center justify-center transition '+(input.trim()?'bg-[#0084c7] text-white shadow-sm hover:bg-[#0070b0]':'bg-gray-200 text-gray-400')}>
                      <Icon n="send" s={17}/>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>}

        {/* ═══ KANBAN ═══ */}
        {menu === 'kanban' && (
          <div className="flex-1 overflow-x-auto p-6">
            <h1 className="text-xl font-bold text-gray-800 mb-6">Kanban</h1>
            <div className="flex gap-4 h-[calc(100vh-140px)]">
              {kanbanCols.map(col => (
                <div key={col.tag.id} className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3"
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('bg-blue-50')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-blue-50'); const id = e.dataTransfer.getData('convId'); if (id) handleDrop(id, col.tag.id); }}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor:col.tag.color}} />
                    <span className="font-semibold text-sm text-gray-700">{col.tag.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{col.convs.length}</span>
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                    {col.convs.map(c => (
                      <div key={c.id} draggable
                        onDragStart={e => { e.dataTransfer.setData('convId', c.id); setDragId(c.id); }}
                        onDragEnd={() => setDragId(null)}
                        className={'bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing transition ' + (dragId === c.id ? 'opacity-50 shadow-md rotate-2' : 'hover:shadow-md')}
                        onClick={()=>{setMenu('atendimento');handleSelect(c)}}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {(c.contact_name||'?').charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-xs text-gray-800 truncate">{c.contact_name||fmtPhone(c.channel_identifier)}</p>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{c.channel_identifier}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{fmtTime(c.last_message_at)}</p>
                      </div>
                    ))}
                    {col.convs.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Nenhuma conversa</p>}
                  </div>
                </div>
              ))}
              {/* Untagged column */}
              <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50'); }}
                onDragLeave={e => e.currentTarget.classList.remove('bg-blue-50')}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-blue-50'); const id = e.dataTransfer.getData('convId'); if (id) handleDrop(id, null); }}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="font-semibold text-sm text-gray-700">Sem tag</span>
                  <span className="text-xs text-gray-400 ml-auto">{untagged.length}</span>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {untagged.map(c => (
                    <div key={c.id} draggable
                      onDragStart={e => { e.dataTransfer.setData('convId', c.id); setDragId(c.id); }}
                      onDragEnd={() => setDragId(null)}
                      className={'bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing transition ' + (dragId === c.id ? 'opacity-50 shadow-md rotate-2' : 'hover:shadow-md')}
                      onClick={()=>{setMenu('atendimento');handleSelect(c)}}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {(c.contact_name||'?').charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-xs text-gray-800 truncate">{c.contact_name||fmtPhone(c.channel_identifier)}</p>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{c.channel_identifier}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{fmtTime(c.last_message_at)}</p>
                    </div>
                  ))}
                  {untagged.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Nenhuma conversa</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAGS ═══ */}
        {menu === 'tags' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-800">Gerenciar Tags</h1>
              <button onClick={()=>{setEditTag(null);setTagName('');setTagColor('#6366f1');setTagModal(true)}}
                className="flex items-center gap-1.5 text-sm font-semibold bg-[#0084c7] text-white px-4 py-2 rounded-lg hover:bg-[#0070b0] transition">
                <Icon n="plus" s={16}/> Nova Tag
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{backgroundColor:t.color}} />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.color}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>{setEditTag(t);setTagName(t.name);setTagColor(t.color);setTagModal(true)}}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Icon n="edit" s={16}/></button>
                      <button onClick={()=>handleDeleteTag(t.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Icon n="trash" s={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {tags.length === 0 && <div className="text-center text-gray-400 py-16"><p className="text-lg mb-2">Nenhuma tag criada</p><p className="text-sm">Crie tags para organizar suas conversas no Kanban</p></div>}
          </div>
        )}

        {/* ═══ Placeholder views ═══ */}
        {['tarefas','respostas','contatos','agendamentos','chat','resultados','ajuda'].includes(menu) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Icon n={menu} s={48} c="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">{menuItems.find(m=>m.k===menu)?.l}</p>
              <p className="text-sm mt-1">Em desenvolvimento</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ TAG MODAL ═══ */}
      {tagModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setTagModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editTag?'Editar Tag':'Nova Tag'}</h3>
              <button onClick={()=>setTagModal(false)}><Icon n="x" s={20} c="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nome da tag</label>
                <input type="text" value={tagName} onChange={e=>setTagName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="ex: vendas, suporte..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Cor</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={tagColor} onChange={e=>setTagColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                  <div className="flex gap-1.5 flex-wrap">
                    {['#7c3aed','#f59e0b','#06b6d4','#ef4444','#10b981','#6366f1','#ec4899','#f97316','#14b8a6','#8b5cf6'].map(hex => (
                      <button key={hex} onClick={()=>setTagColor(hex)}
                        className={'w-6 h-6 rounded-full border-2 '+(tagColor===hex?'border-gray-800':'border-transparent')}
                        style={{backgroundColor:hex}} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-sm font-medium" style={{backgroundColor:tagColor+'20',color:tagColor}}>
                  {tagName||'preview'}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setTagModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveTag} className="flex-1 bg-[#0084c7] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#0070b0]">{editTag?'Salvar':'Criar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ POPUP (VISUALIZAR SEM MARCAR) ═══ */}
      {popupConv && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setPopupConv(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
                  {(popupConv.contact_name||'?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{popupConv.contact_name||fmtPhone(popupConv.channel_identifier)}</p>
                  <p className="text-xs text-gray-400">Visualização sem marcação de leitura</p>
                </div>
              </div>
              <button onClick={()=>setPopupConv(null)} className="text-gray-400 hover:text-gray-600"><Icon n="x" s={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{backgroundImage:'radial-gradient(circle at 1px 1px,#e2e4e9 1px,transparent 0)',backgroundSize:'20px 20px'}}>
              {popupMsgs.length===0 ? <div className="text-center text-gray-400 text-sm py-8">Nenhuma mensagem</div>
              : [...popupMsgs].reverse().map((m,i) => (
                <div key={m.id||i} className={'flex '+(m.role==='user'||m.direction==='incoming'?'justify-start':'justify-end')}>
                  <div className={'max-w-[80%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl '+(m.role==='user'||m.direction==='incoming'?'bg-gray-100 text-gray-800 rounded-tl-sm':'bg-[#0084c7]/80 text-white rounded-tr-sm')}>
                    <p>{m.content}</p>
                    <p className={'text-[10px] mt-1 '+(m.role==='user'||m.direction==='incoming'?'text-gray-400':'text-blue-200')}>{fmtTime(m.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 text-center text-xs text-gray-400">
              Apenas visualização — cliente não vê confirmação de leitura
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
