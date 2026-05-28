'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/* ─── Types ─── */
interface Tag { id: string; name: string; color: string; }
interface Conversation { id: string; channel_identifier: string; contact_name: string | null; last_message_at: string; status: string; channel_type: string; profile_pic_url?: string; }
interface Message { id: string; content: string; role: string; created_at: string; direction?: string; type?: string; status?: string; }
interface Contact { id: string; name: string; phone: string; email?: string|null; avatar_url?: string|null; channel_type: string; notes?: string|null; created_at: string; }

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
  microphone:'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  play:'<polygon points="5 3 19 12 5 21 5 3"/>',
  pause:'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
};
function Icon({ n, s = 20, c = '' }: { n: string; s?: number; c?: string }) {
  return <svg className={c} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: S[n]||'' }} />;
}
function StatusIcon({ status, direction, id }: { status?: string; direction?: string; id?: string }) {
  if (direction !== 'outgoing' || String(id||'').startsWith('sending')) return null;
  const c = status==='read' ? 'text-blue-400' : 'text-gray-400';
  if (status==='failed') return <span className="text-red-400 text-xs ml-1">!</span>;
  const one = '\u2713';
  const two = '\u2713\u2713';
  return <span className={c+' text-xs ml-1'}>{status==='delivered'||status==='read'?two:one}</span>;
}
function Avatar({ name, url, size = 10 }: { name?: string|null; url?: string|null; size?: number }) {
  const sz = size >= 11 ? 'w-11 h-11' : size >= 10 ? 'w-10 h-10' : size >= 7 ? 'w-7 h-7' : 'w-9 h-9';
  const ts = size >= 11 ? 'text-sm' : size >= 10 ? 'text-sm' : size >= 7 ? 'text-[10px]' : 'text-xs';
  const base = sz+' rounded-full flex-shrink-0';
  if (url) return <img src={url} alt="" className={base+' object-cover'} />;
  return <div className={base+' bg-gradient-to-br from-[#0084c7] to-blue-400 flex items-center justify-center text-white font-semibold '+ts}>{(name||'?').charAt(0).toUpperCase()}</div>;
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
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob|null>(null);
  const [recordingSec, setRecordingSec] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactModal, setContactModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact|null>(null);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cType, setCType] = useState('whatsapp');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const emojiRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);

  const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','👌','❤️','🧡','💛','💚','💙','💜','🖤','💔','💕','💞','💗','💖','✨','🔥','⭐','🌟','💯','✅','❌','❓','❗','🎉','🎊'];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingSec(0);
      setRecordedBlob(null);
      setPreviewUrl(null);
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingSec(s => s + 1), 1000);
    } catch (e) { console.error('Recording error:', e); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); };
  const cancelRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingSec(0);
  };
  const sendAudioBlob = async () => {
    if (!recordedBlob || !sel) return;
    const fd = new FormData();
    fd.append('file', recordedBlob, 'recording_'+Date.now()+'.webm');
    setUploading(true);
    const r = await fetch('/api/media/upload', { method: 'POST', body: fd });
    const j = await r.json();
    if (j.success) {
      setMsgs(p=>[...p,{id:'sending',content:j.url,role:'assistant',created_at:new Date().toISOString(),direction:'outgoing',type:'audio'}]);
      await fetch('/api/crm/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation_id:sel.id,content:'',type:'audio',media_url:j.url})});
      loadMsgs(sel.id);
    }
    setUploading(false);
    cancelRecording();
  };
  const fmtSec = (s: number) => { const m = Math.floor(s/60); return String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSendMedia = async (file: File) => {
    if (!sel) return;
    const mediaType = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
    const ext = file.name.split('.').pop() || 'bin';
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file, `media.${ext}`);
    try {
      const r = await fetch('/api/media/upload', { method: 'POST', body: fd });
      const j = await r.json();
      if (j.success) {
        setMsgs(p=>[...p,{id:'sending',content:j.url,role:'assistant',created_at:new Date().toISOString(),direction:'outgoing',type:mediaType}]);
        const mr = await fetch('/api/crm/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: sel.id, content: '', type: mediaType, media_url: j.url }) });
        if (!mr.ok) setMsgs(p=>p.filter(m=>m.id!=='sending'));
        loadMsgs(sel.id);
      }
    } catch {}
    setUploading(false);
  };

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
    try { const r=await fetch('/api/crm/conversations'); const d=await r.json(); setConvs(d.data||[]); } catch { setConvs([]); }
  }, []);

  const [clock, setClock] = useState(0);
  useEffect(() => { loadConvs(); loadTags(); loadAllConvTags(); setLoading(false); }, [loadConvs, loadTags, loadAllConvTags]);

  useEffect(() => { const t = setInterval(() => setClock(c => c + 1), 10000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(loadConvs, 5000); return () => clearInterval(t); }, [loadConvs]);

  useEffect(() => { if(!sel)return; const t = setInterval(() => loadMsgs(sel.id), 3000); return () => clearInterval(t); }, [sel]);

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

  const loadContacts = useCallback(async () => {
    try { const r=await fetch('/api/crm/contacts?limit=200'); const d=await r.json(); setContacts(d.data||[]); } catch { setContacts([]); }
  }, []);

  const handleSaveContact = async () => {
    if(!cName.trim()||!cPhone.trim())return;
    if(editContact) {
      await fetch('/api/crm/contacts',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editContact.id,name:cName,phone:cPhone,email:cEmail||null,channel_type:cType})});
    } else {
      await fetch('/api/crm/contacts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:cName,phone:cPhone,email:cEmail||null,channel_type:cType})});
    }
    setContactModal(false); setEditContact(null); setCName(''); setCPhone(''); setCEmail(''); setCType('whatsapp'); loadContacts();
  };

  const handleDeleteContact = async (id: string) => {
    await fetch('/api/crm/contacts?id='+id,{method:'DELETE'}); loadContacts();
  };

  const startContactConv = async (name: string, phone: string) => {
    const r = await fetch('/api/crm/conversations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({channel_identifier:phone.replace(/\D/g,''),contact_name:name,channel_type:'whatsapp'})});
    const d = await r.json();
    if (d.data) { setMenu('atendimento'); setSel(d.data); loadMsgs(d.data.id); setMobile(false); }
  };

  useEffect(() => { loadContacts(); }, [loadContacts]);

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
                  <Avatar name={c.contact_name} url={c.profile_pic_url} size={11} />
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
                      <button onClick={async (e)=>{e.stopPropagation(); await fetch('/api/crm/conversations',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,status:'attending'})}); loadConvs();}}
                        className="text-[10px] font-semibold border border-blue-500 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-50 transition" title="Reativar conversa">
                        Reativar
                      </button>
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
                  <Avatar name={sel.contact_name} url={sel.profile_pic_url} size={10} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{sel.contact_name||fmtPhone(sel.channel_identifier)}</p>
                    <p className="text-xs text-green-600 font-medium">Online</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {sel.status === 'resolved' ? (
                      <button onClick={async () => {
                        await fetch('/api/crm/conversations',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:sel.id,status:'attending'})});
                        setSel(null); setMsgs([]); loadConvs();
                      }} className="text-xs font-semibold border border-blue-500 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition mr-1">
                        Reativar
                      </button>
                    ) : sel.status !== 'archived' && sel.status !== 'blocked' ? (
                      <button onClick={async () => {
                        await fetch('/api/crm/conversations',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:sel.id,status:'resolved'})});
                        setSel(null); setMsgs([]); loadConvs();
                      }} className="text-xs font-semibold border border-green-500 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition mr-1">
                        Finalizar
                      </button>
                    ) : null}
                    {['info','more'].map(i => (
                      <button key={i} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Icon n={i} s={19}/></button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 scroll-smooth" style={{backgroundImage:'radial-gradient(circle at 1px 1px,#e2e4e9 1px,transparent 0)',backgroundSize:'20px 20px'}}>
                  {msgs.length===0 ? <div className="text-center text-gray-400 text-sm py-12">Nenhuma mensagem ainda</div>
                  : [...msgs].reverse().map((m,i) => (
                    <div key={m.id||i} className={'flex '+(m.role==='user'||m.direction==='incoming'?'justify-start':'justify-end')}>
                      <div className={'max-w-[70%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl '+(m.role==='user'||m.direction==='incoming'?'bg-white text-gray-800 shadow-sm rounded-tl-sm':'bg-[#0084c7] text-white rounded-tr-sm')}>
                        {m.type === 'image' ? (
                          <img src={m.content} alt="imagem" className="max-w-full rounded-lg" loading="lazy" />
                        ) : m.type === 'video' ? (
                          <video src={m.content} controls className="max-w-full rounded-lg" />
                        ) : m.type === 'audio' ? (
                          <audio src={m.content} controls className="max-w-full" />
                        ) : (
                          <p>{m.content}</p>
                        )}
                        <p className={'text-[10px] mt-1.5 '+(m.role==='user'||m.direction==='incoming'?'text-gray-400':'text-blue-200')}>{fmtTime(m.created_at)}<StatusIcon status={m.status} direction={m.direction} id={m.id}/></p>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef}/>
                </div>
                <div className="bg-white border-t border-gray-200 px-5 py-3">
                  {recordedBlob && previewUrl ? (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2">
                      <button onClick={()=>{if(!isPlaying){previewRef.current?.play();setIsPlaying(true)}else{previewRef.current?.pause();setIsPlaying(false)}}} className="w-9 h-9 rounded-full bg-[#0084c7] text-white flex items-center justify-center hover:bg-[#0070b0]">
                        {isPlaying ? <Icon n="pause" s={16}/> : <Icon n="play" s={16}/>}
                      </button>
                      <audio ref={previewRef} src={previewUrl} onEnded={()=>setIsPlaying(false)} className="hidden" />
                      <span className="text-sm text-gray-600 font-mono">{fmtSec(recordingSec)}</span>
                      <div className="flex-1 h-1 bg-gray-200 rounded-full"><div className="h-1 bg-[#0084c7] rounded-full" style={{width:'30%'}}/></div>
                      <button onClick={sendAudioBlob} disabled={uploading} className="text-green-600 hover:text-green-700 p-1 disabled:opacity-50"><Icon n="check" s={20}/></button>
                      <button onClick={cancelRecording} className="text-red-400 hover:text-red-600 p-1"><Icon n="trash" s={20}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-1.5">
                      <div className="relative">
                        <button onClick={()=>setShowEmoji(!showEmoji)} className="text-gray-400 hover:text-gray-600 p-1"><Icon n="emoji" s={20}/></button>
                        {showEmoji && <div ref={emojiRef} className="absolute bottom-full left-0 mb-2 bg-white border rounded-xl shadow-xl p-2 grid grid-cols-8 gap-1 z-50 w-72 max-h-52 overflow-y-auto">
                          {EMOJIS.map((e,i) => (
                            <button key={i} onClick={()=>{setInput(p=>p+e);setShowEmoji(false)}} className="hover:bg-gray-100 rounded p-1 text-lg leading-none">{e}</button>
                          ))}
                        </div>}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*" onChange={e=>{const f=e.target.files?.[0];if(f){handleSendMedia(f);e.target.value=''}}} />
                      <button onClick={()=>fileInputRef.current?.click()} disabled={uploading} className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50">{uploading?<span className="text-[10px]">...</span>:<Icon n="attach" s={20}/>}</button>
                      {isRecording ? (
                        <div className="flex-1 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm text-red-500 font-medium">Gravando {fmtSec(recordingSec)}</span>
                          <button onClick={stopRecording} className="ml-auto w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"><Icon n="x" s={14}/></button>
                        </div>
                      ) : (
                        <>
                          <button onClick={startRecording} className="text-gray-400 hover:text-gray-600 p-1" title="Gravar áudio"><Icon n="microphone" s={20}/></button>
                          <input type="text" placeholder={uploading?'Enviando mídia...':'Digite sua mensagem...'} value={input} onChange={e=>setInput(e.target.value)}
                            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}}
                            className="flex-1 bg-transparent text-sm outline-none py-1.5 px-2 placeholder:text-gray-300" disabled={uploading} />
                          <button onClick={handleSend}
                            className={'w-9 h-9 rounded-full flex items-center justify-center transition '+(input.trim()?'bg-[#0084c7] text-white shadow-sm hover:bg-[#0070b0]':'bg-gray-200 text-gray-400')}>
                            <Icon n="send" s={17}/>
                          </button>
                        </>
                      )}
                    </div>
                  )}
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
                          <Avatar name={c.contact_name} url={c.profile_pic_url} size={7} />
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
                        <Avatar name={c.contact_name} url={c.profile_pic_url} size={7} />
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

        {/* ═══ CONTATOS ═══ */}
        {menu === 'contatos' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-lg font-bold text-gray-800">Contatos</h1>
                  <button onClick={()=>{setEditContact(null);setCName('');setCPhone('');setCEmail('');setCType('whatsapp');setContactModal(true)}}
                    className="flex items-center gap-1 text-sm font-semibold bg-[#0084c7] text-white px-3 py-1.5 rounded-lg hover:bg-[#0070b0] transition">
                    <Icon n="plus" s={15}/> Novo
                  </button>
                </div>
                <div className="relative">
                  <Icon n="search" s={15} c="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="text" placeholder="Pesquisar contato..." value={contactSearch} onChange={e=>setContactSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#0084c7]/20 placeholder:text-gray-300" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.filter(c => {const q=contactSearch.toLowerCase();return!q||c.name.toLowerCase().includes(q)||c.phone.includes(q)||(c.email||'').toLowerCase().includes(q);}).map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50" onClick={()=>{setCName(c.name);setCPhone(c.phone);setCEmail(c.email||'');setCType(c.channel_type);setEditContact(c);setContactModal(true)}}>
                    <Avatar name={c.name} url={c.avatar_url} size={10} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone}</p>
                    </div>
                    <span className={'text-[10px] font-medium px-2 py-0.5 rounded-full '+(c.channel_type==='whatsapp'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700')}>{c.channel_type}</span>
                  </div>
                ))}
                {contacts.length === 0 && <div className="text-center text-gray-400 py-12 text-sm">Nenhum contato ainda</div>}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"><Icon n="contatos" s={36} c="text-gray-400"/></div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Selecione um contato</h2>
                <p className="text-sm text-gray-400">Clique em um contato ao lado para ver detalhes ou editar</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CONTACT MODAL ═══ */}
        {contactModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setContactModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{editContact?'Editar Contato':'Novo Contato'}</h3>
                <button onClick={()=>setContactModal(false)}><Icon n="x" s={20} c="text-gray-400 hover:text-gray-600"/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nome</label>
                  <input type="text" value={cName} onChange={e=>setCName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="Nome do contato" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Telefone</label>
                  <input type="text" value={cPhone} onChange={e=>setCPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="+5565992774293" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                  <input type="email" value={cEmail} onChange={e=>setCEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Canal</label>
                  <select value={cType} onChange={e=>setCType(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
              </div>
              {editContact && (
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>startContactConv(editContact.name, editContact.phone)}
                    className="flex-1 border border-[#0084c7] text-[#0084c7] rounded-lg py-2 text-sm font-medium hover:bg-blue-50 transition">
                    Iniciar Conversa
                  </button>
                  <button onClick={()=>{if(confirm('Excluir este contato?')){handleDeleteContact(editContact.id);}}}
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200">
                    <Icon n="trash" s={16}/>
                  </button>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={()=>setContactModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSaveContact} className="flex-1 bg-[#0084c7] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#0070b0]">{editContact?'Salvar':'Criar'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Placeholder views ═══ */}
        {['tarefas','respostas','agendamentos','chat','resultados','ajuda'].includes(menu) && (
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
                <Avatar name={popupConv.contact_name} url={popupConv.profile_pic_url} size={9} />
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
