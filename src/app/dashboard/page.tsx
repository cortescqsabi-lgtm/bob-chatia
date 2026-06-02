'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import TrialBlock from '@/components/TrialBlock';

/* ─── Types ─── */
interface Tag { id: string; name: string; color: string; }
interface Conversation { id: string; channel_identifier: string; contact_name: string | null; last_message_at: string; status: string; channel_type: string; profile_pic_url?: string; }
interface Message { id: string; content: string; role: string; created_at: string; direction?: string; type?: string; status?: string; }
interface Contact { id: string; name: string; phone: string; email?: string|null; avatar_url?: string|null; channel_type: string; notes?: string|null; created_at: string; }
interface Task { id: string; name: string; tagId: string; messageTemplate: string; type: 'upsell' | 'retorno' | 'qualificacao'; status: 'pending' | 'running' | 'completed' | 'failed'; runCount: number; successCount: number; createdAt: string; chipInstance?: string; }
interface QuickResponse { id: string; shortcut: string; title: string; content: string; }
interface Appointment {
  id: string;
  title: string;
  contact_name: string;
  contact_phone: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes: string;
}

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
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  produtos: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
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
  { k: 'produtos', l: 'Produtos' },
  { k: 'resultados', l: 'Resultados' }, { k: 'ajuda', l: 'Ajuda' },
];

function HelpAccordion({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-help-item={item.q + ' ' + item.a} className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left">
        <span className="text-sm font-semibold text-gray-800">{item.q}</span>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {open && <p className="pb-3.5 text-sm leading-relaxed text-gray-600">{item.a}</p>}
    </div>
  );
}


function fmtPhone(r: string) { const d = r.replace(/\D/g,''); if(d.length===13)return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`; if(d.length===12)return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`; return r; }
function fmtTime(iso: string) { if(!iso)return''; const d=new Date(iso), n=new Date(), df=(n.getTime()-d.getTime())/1000; if(df<60)return'agora'; if(df<3600)return Math.floor(df/60)+'min'; if(df<86400)return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); if(df<172800)return'ontem'; return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}); }


export default function CrmPage() {
  const [menu, setMenu] = useState('atendimento');
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<Task|null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskTagId, setTaskTagId] = useState('');
  const [taskMessageTemplate, setTaskMessageTemplate] = useState('');
  const [taskType, setTaskType] = useState<'upsell'|'retorno'|'qualificacao'>('upsell');
  const [runningTaskId, setRunningTaskId] = useState<string|null>(null);
  const [taskChipInstance, setTaskChipInstance] = useState('b2zap');
  const [chipsList, setChipsList] = useState<any[]>([]);
  const [pairingQr, setPairingQr] = useState<string|null>(null);
  const [pairingSlot, setPairingSlot] = useState<number|null>(null);
  const [editingChipSlot, setEditingChipSlot] = useState<number|null>(null);
  const [editingChipName, setEditingChipName] = useState('');
  const [quickResponsesList, setQuickResponsesList] = useState<QuickResponse[]>([]);
  const [quickResponseModal, setQuickResponseModal] = useState(false);
  const [editQuickResponse, setEditQuickResponse] = useState<QuickResponse|null>(null);
  const [qrShortcut, setQrShortcut] = useState('');
  const [qrTitle, setQrTitle] = useState('');
  const [qrContent, setQrContent] = useState('');
  const [qrShowEmoji, setQrShowEmoji] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [editAppointment, setEditAppointment] = useState<Appointment|null>(null);
  const [apTitle, setApTitle] = useState('');
  const [apContactName, setApContactName] = useState('');
  const [apContactPhone, setApContactPhone] = useState('');
  const [apDate, setApDate] = useState('');
  const [apTime, setApTime] = useState('');
  const [apType, setApType] = useState('Reuniao');
  const [apStatus, setApStatus] = useState('agendado');
  const [apNotes, setApNotes] = useState('');
  const [apFilterStatus, setApFilterStatus] = useState('todos');
  const [apFilterType, setApFilterType] = useState('todos');
  const [apSearchQuery, setApSearchQuery] = useState('');
  const [userRoleSim, setUserRoleSim] = useState('admin');
  const [currentUserSim, setCurrentUserSim] = useState<any>({ id: '1', name: 'Administrador Principal', email: 'admin@vendazap.com.br', role: 'admin' });
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [selectedInternalUser, setSelectedInternalUser] = useState<any | null>(null);
  const [internalMsgs, setInternalMsgs] = useState<any[]>([]);
  const [internalInput, setInternalInput] = useState('');
  const [internalSearch, setInternalSearch] = useState('');
  const [showTagPicker, setShowTagPicker] = useState<string|null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob|null>(null);
  const [recordingSec, setRecordingSec] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudio, setActiveAudio] = useState<string|null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
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
  const previousMsgIdsRef = useRef<Set<string>>(new Set());

  // ── Produtos ──────────────────────────────────────────────────────────────
  interface Product { id: string; sku: string; name: string; description?: string; category?: string; base_price: number; cost_price?: number; stock_quantity?: number; is_active: boolean; image_url?: string; }
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [productModal, setProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCat, setPCat] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCost, setPCost] = useState('');
  const [pStock, setPStock] = useState('');
  const [pImage, setPImage] = useState('');
  const [pActive, setPActive] = useState(true);
  const [productImporting, setProductImporting] = useState(false);
  const [productImportStatus, setProductImportStatus] = useState('');
  const [productImportPreview, setProductImportPreview] = useState<any[]>([]);
  const [productImportColumns, setProductImportColumns] = useState<string[]>([]);
  const [productImportStep, setProductImportStep] = useState<'idle'|'preview'|'done'>('idle');
  const productFileRef = useRef<HTMLInputElement>(null);

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

  const playAudio = (msgId: string, src: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => { setActiveAudio(null); setAudioProgress(0); if (audioTimerRef.current) clearInterval(audioTimerRef.current); };
      audioRef.current.onloadedmetadata = () => setAudioDuration(audioRef.current!.duration || 0);
    }
    if (activeAudio === msgId && !audioRef.current.paused) {
      audioRef.current.pause();
      setActiveAudio(null);
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    } else {
      if (audioRef.current.src !== src) {
        audioRef.current.src = src;
        audioRef.current.load();
      }
      audioRef.current.play().then(() => { setActiveAudio(msgId); if (audioTimerRef.current) clearInterval(audioTimerRef.current); audioTimerRef.current = setInterval(() => { setAudioProgress(audioRef.current?.currentTime || 0); }, 250); }).catch(() => setActiveAudio(null));
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) setMobileMenuOpen(false);
    };
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

  // Helper: lê o tenant_id do usuário logado
  const getTenantId = useCallback(() => {
    try {
      const u = localStorage.getItem('currentUser');
      if (u) return JSON.parse(u).tenant_id || '';
    } catch {}
    return '';
  }, []);

  const getTenantHeaders = useCallback((extra: Record<string, string> = {}) => {
    const tid = getTenantId();
    const headers: Record<string, string> = { ...extra };
    if (tid) headers['x-tenant-id'] = tid;
    return headers;
  }, [getTenantId]);

  const loadTags = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      const r = await fetch('/api/tags', { headers });
      const d = await r.json();
      setTags(d.data || []);
    } catch {}
  }, [getTenantHeaders]);

  const loadAllConvTags = useCallback(async () => {
    try {
      const headers = getTenantHeaders({ 'Content-Type': 'application/json' });
      const r = await fetch('/api/tags', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'get_all_tags' })
      });
      const d = await r.json();
      if (d.data) setConvTags(d.data);
    } catch {}
  }, [getTenantHeaders]);

  const loadConvs = useCallback(async () => {
    try {
      const tid = getTenantId();
      const headers: Record<string, string> = {};
      if (tid) headers['x-tenant-id'] = tid;
      const r = await fetch('/api/crm/conversations', { headers });
      const d = await r.json();
      setConvs(d.data || []);
    } catch { setConvs([]); }
  }, []);

  // ── Funções de Produtos ────────────────────────────────────────────────────
  const loadProducts = useCallback(async (search = '', category = '') => {
    try {
      const tid = getTenantId();
      const headers: Record<string, string> = {};
      if (tid) headers['x-tenant-id'] = tid;
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const r = await fetch(`/api/products?${params}`, { headers });
      const d = await r.json();
      setProducts(d.data || []);
      setProductCategories(d.categories || []);
    } catch { setProducts([]); }
  }, []);

  const handleSaveProduct = async () => {
    if (!pName.trim()) return;
    const tid = getTenantId();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tid) headers['x-tenant-id'] = tid;
    const body = {
      ...(editProduct ? { id: editProduct.id } : {}),
      sku: pSku.trim() || pName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30),
      name: pName.trim(),
      description: pDesc.trim() || null,
      category: pCat.trim() || null,
      base_price: parseFloat(pPrice.replace(',', '.')) || 0,
      cost_price: pCost ? parseFloat(pCost.replace(',', '.')) : null,
      stock_quantity: pStock ? parseInt(pStock) : 0,
      image_url: pImage.trim() || null,
      is_active: pActive,
    };
    const method = editProduct ? 'PUT' : 'POST';
    const r = await fetch('/api/products', { method, headers, body: JSON.stringify(body) });
    if (r.ok) {
      setProductModal(false); setEditProduct(null);
      setPName(''); setPSku(''); setPDesc(''); setPCat(''); setPPrice(''); setPCost(''); setPStock(''); setPImage(''); setPActive(true);
      loadProducts(productSearch, productCategory);
    } else {
      const errData = await r.json().catch(() => ({}));
      alert('Erro ao salvar produto: ' + (errData.error || 'Erro interno do servidor. Verifique se executou a migration SQL no painel do Supabase.'));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    const tid = getTenantId();
    const headers: Record<string, string> = {};
    if (tid) headers['x-tenant-id'] = tid;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE', headers });
    loadProducts(productSearch, productCategory);
  };

  const handleProductImport = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setProductImporting(true);
    setProductImportStatus('⏳ Lendo arquivo...');
    setProductImportStep('idle');
    try {
      const XLSX = await import('xlsx');
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (rows.length === 0) { setProductImportStatus('❌ Planilha vazia ou sem dados.'); setProductImporting(false); return; }
      const cols = Object.keys(rows[0]);
      setProductImportColumns(cols);
      setProductImportPreview(rows.slice(0, 5));
      setProductImportStep('preview');
      setProductImportStatus(`✅ ${rows.length} linhas encontradas. Clique em "Importar" para salvar.`);

      // Guarda as rows completas para importação
      (window as any).__productImportRows = rows;
    } catch (e: any) {
      setProductImportStatus('❌ Erro ao ler arquivo: ' + e.message);
    } finally {
      setProductImporting(false);
      if (productFileRef.current) productFileRef.current.value = '';
    }
  };

  const confirmProductImport = async () => {
    const rows = (window as any).__productImportRows;
    if (!rows) return;
    setProductImporting(true);
    setProductImportStatus('⏳ Importando produtos...');
    try {
      const tid = getTenantId();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tid) headers['x-tenant-id'] = tid;
      const r = await fetch('/api/products/import', { method: 'POST', headers, body: JSON.stringify({ rows }) });
      const d = await r.json();
      if (d.success) {
        setProductImportStatus(`✅ Concluído! ${d.inserted} novos, ${d.updated} atualizados${d.skipped ? `, ${d.skipped} ignorados` : ''}.`);
        setProductImportStep('done');
        delete (window as any).__productImportRows;
        loadProducts(productSearch, productCategory);
      } else {
        setProductImportStatus('❌ ' + (d.error || 'Erro na importação'));
      }
    } catch (e: any) {
      setProductImportStatus('❌ ' + e.message);
    } finally {
      setProductImporting(false);
    }
  };

  const loadTasksList = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      const r = await fetch('/api/tasks', { headers });
      const d = await r.json();
      setTasksList(d.data || []);
    } catch {}
  }, [getTenantHeaders]);

  const loadChipsList = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      const r = await fetch('/api/tasks/chips', { headers });
      const d = await r.json();
      setChipsList(d.data || []);
    } catch {}
  }, [getTenantHeaders]);

  const loadQuickResponses = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      const r = await fetch('/api/quick-responses', { headers });
      const d = await r.json();
      setQuickResponsesList(d.data || []);
    } catch {}
  }, [getTenantHeaders]);

  const loadAppointments = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      const r = await fetch('/api/appointments', { headers });
      const d = await r.json();
      setAppointmentsList(d.data || []);
    } catch {}
  }, [getTenantHeaders]);

  const loadInternalUsers = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      const r = await fetch('/api/users', { headers });
      const d = await r.json();
      setInternalUsers(d.data || []);
    } catch {}
  }, [getTenantHeaders]);

  const loadInternalMsgs = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      const r = await fetch('/api/internal-messages', { headers });
      const d = await r.json();
      setInternalMsgs(d.data || []);
    } catch {}
  }, [getTenantHeaders]);

  const handleSendInternalMsg = async () => {
    if (!internalInput.trim() || !selectedInternalUser || !currentUserSim) return;
    const content = internalInput.trim();
    setInternalInput('');
    const tempMsg = {
      id: 'sending-' + Date.now(),
      senderId: currentUserSim.id,
      receiverId: selectedInternalUser.id,
      content,
      createdAt: new Date().toISOString()
    };
    setInternalMsgs(prev => [...prev, tempMsg]);
    
    try {
      const headers = getTenantHeaders({ 'Content-Type': 'application/json' });
      await fetch('/api/internal-messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          senderId: currentUserSim.id,
          receiverId: selectedInternalUser.id,
          content
        })
      });
    } catch {}
    loadInternalMsgs();
  };

  const [clock, setClock] = useState(0);
  useEffect(() => { loadConvs(); loadTags(); loadAllConvTags(); loadTasksList(); loadChipsList(); loadQuickResponses(); loadAppointments(); loadInternalUsers(); loadInternalMsgs(); setLoading(false); }, [loadConvs, loadTags, loadAllConvTags, loadTasksList, loadChipsList, loadQuickResponses, loadAppointments, loadInternalUsers, loadInternalMsgs]);

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUserSim(parsed);
        setUserRoleSim(parsed.role);
      } else {
        window.location.href = '/auth/login';
      }
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    const t = setInterval(syncUser, 2000);
    return () => {
      window.removeEventListener('storage', syncUser);
      clearInterval(t);
    };
  }, []);

  // Request notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Global polling for internal messages and users
  useEffect(() => {
    loadInternalUsers();
    loadInternalMsgs();
    const t = setInterval(() => {
      loadInternalMsgs();
    }, 4000);
    return () => clearInterval(t);
  }, [loadInternalUsers, loadInternalMsgs]);

  // Monitor new incoming messages to play sound and trigger notifications
  useEffect(() => {
    if (!currentUserSim) return;
    const newIds = new Set<string>();
    let hasNewIncoming = false;
    let latestMsg: any = null;

    internalMsgs.forEach((m: any) => {
      newIds.add(m.id);
      if (previousMsgIdsRef.current.size > 0 && !previousMsgIdsRef.current.has(m.id)) {
        if (m.receiverId === currentUserSim.id) {
          const ageMs = Date.now() - new Date(m.createdAt).getTime();
          if (ageMs < 15000) {
            hasNewIncoming = true;
            latestMsg = m;
          }
        }
      }
    });

    previousMsgIdsRef.current = newIds;

    if (hasNewIncoming && latestMsg) {
      // Play a premium sound notification
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
      audio.volume = 0.5;
      audio.play().catch(() => {});

      // Show native browser notification if window is out of focus
      if (document.hidden && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const sender = internalUsers.find(u => u.id === latestMsg.senderId);
        new Notification(`Mensagem interna de ${sender?.name || 'Colega'}`, {
          body: latestMsg.content,
        });
      }
    }
  }, [internalMsgs, currentUserSim, internalUsers]);

  // Sincroniza leitura do chat interno e reseta badges
  useEffect(() => {
    if (menu === 'chat' && selectedInternalUser && currentUserSim) {
      localStorage.setItem(`lastReadInternalChat_${selectedInternalUser.id}`, new Date().toISOString());
      setClock(c => c + 1);
    }
  }, [menu, selectedInternalUser, internalMsgs, currentUserSim]);

  useEffect(() => { const t = setInterval(() => setClock(c => c + 1), 10000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(loadConvs, 5000); return () => clearInterval(t); }, [loadConvs]);

  useEffect(() => { if(!sel)return; const t = setInterval(() => loadMsgs(sel.id), 3000); return () => clearInterval(t); }, [sel]);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);

  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } if (audioTimerRef.current) clearInterval(audioTimerRef.current); }; }, []);

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
    try {
      const tid = getTenantId();
      const headers: Record<string, string> = {};
      if (tid) headers['x-tenant-id'] = tid;
      const r = await fetch('/api/crm/contacts?limit=200', { headers });
      const d = await r.json();
      setContacts(d.data || []);
    } catch { setContacts([]); }
  }, []);

  const handleSaveContact = async () => {
    if(!cName.trim()||!cPhone.trim())return;
    const tid = getTenantId();
    const tHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tid) tHeaders['x-tenant-id'] = tid;
    if(editContact) {
      await fetch('/api/crm/contacts',{method:'PUT',headers:tHeaders,body:JSON.stringify({id:editContact.id,name:cName,phone:cPhone,email:cEmail||null,channel_type:cType,tenant_id:tid})});
    } else {
      await fetch('/api/crm/contacts',{method:'POST',headers:tHeaders,body:JSON.stringify({name:cName,phone:cPhone,email:cEmail||null,channel_type:cType,tenant_id:tid})});
    }
    setContactModal(false); setEditContact(null); setCName(''); setCPhone(''); setCEmail(''); setCType('whatsapp'); loadContacts();
  };

  const handleDeleteContact = async (id: string) => {
    await fetch('/api/crm/contacts?id='+id,{method:'DELETE'}); loadContacts();
  };

  const handleSaveTask = async () => {
    if(!taskName.trim()||!taskTagId||!taskMessageTemplate.trim())return;
    const body = {
      id: editTask?.id,
      name: taskName,
      tagId: taskTagId,
      messageTemplate: taskMessageTemplate,
      type: taskType,
      status: editTask?.status || 'pending',
      runCount: editTask?.runCount || 0,
      successCount: editTask?.successCount || 0,
      createdAt: editTask?.createdAt,
      chipInstance: taskChipInstance
    };
    const method = editTask ? 'PUT' : 'POST';
    const r = await fetch('/api/tasks', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if(r.ok) {
      setTaskModal(false); setEditTask(null); setTaskName(''); setTaskTagId(''); setTaskMessageTemplate(''); setTaskType('upsell'); setTaskChipInstance('b2zap'); loadTasksList();
    }
  };

  const handleDeleteTask = async (id: string) => {
    if(!confirm('Deseja realmente excluir esta tarefa?'))return;
    const r = await fetch('/api/tasks?id='+id, { method: 'DELETE' });
    if(r.ok) loadTasksList();
  };

  const handleRunTask = async (id: string) => {
    setRunningTaskId(id);
    setTasksList(prev => prev.map(t => t.id === id ? { ...t, status: 'running' } : t));
    try {
      const r = await fetch('/api/tasks/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: id }) });
      const d = await r.json();
      if (d.success) {
        alert(d.message || 'Tarefa concluída com sucesso!');
      } else {
        alert('Erro ao executar tarefa: ' + (d.error || 'Erro desconhecido'));
      }
    } catch (e: any) {
      alert('Erro de rede ao executar tarefa: ' + e.message);
    } finally {
      setRunningTaskId(null);
      loadTasksList();
    }
  };

  const handleConnectChip = async (slot: number, name: string) => {
    setPairingSlot(slot);
    setPairingQr(null);
    try {
      const r = await fetch('/api/tasks/chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', slot, name })
      });
      const d = await r.json();
      if (d.connected) {
        alert('Chip já está conectado!');
        setPairingSlot(null);
        loadChipsList();
      } else if (d.qrcode) {
        setPairingQr(d.qrcode);
      } else {
        alert('Erro ao conectar chip: ' + (d.error || 'Erro desconhecido'));
        setPairingSlot(null);
      }
    } catch (e: any) {
      alert('Erro de rede: ' + e.message);
      setPairingSlot(null);
    }
  };

  const handleDisconnectChip = async (slot: number) => {
    if (!confirm('Deseja realmente desconectar este chip? Ele será removido das campanhas.')) return;
    try {
      const r = await fetch('/api/tasks/chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', slot })
      });
      if (r.ok) {
        loadChipsList();
      }
    } catch {}
  };

  const handleRenameChip = async () => {
    if (editingChipSlot === null || !editingChipName.trim()) return;
    try {
      const r = await fetch('/api/tasks/chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', slot: editingChipSlot, name: editingChipName })
      });
      if (r.ok) {
        setEditingChipSlot(null);
        setEditingChipName('');
        loadChipsList();
      }
    } catch {}
  };

  const handleSaveQuickResponse = async () => {
    if(!qrTitle.trim()||!qrContent.trim()||!qrShortcut.trim())return;
    const body = {
      id: editQuickResponse?.id,
      shortcut: qrShortcut,
      title: qrTitle,
      content: qrContent
    };
    const method = editQuickResponse ? 'PUT' : 'POST';
    const r = await fetch('/api/quick-responses', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if(r.ok) {
      setQuickResponseModal(false); setEditQuickResponse(null); setQrShortcut(''); setQrTitle(''); setQrContent(''); setQrShowEmoji(false); loadQuickResponses();
    }
  };

  const handleDeleteQuickResponse = async (id: string) => {
    if(!confirm('Deseja realmente excluir esta resposta rápida?'))return;
    const r = await fetch('/api/quick-responses?id='+id, { method: 'DELETE' });
    if(r.ok) loadQuickResponses();
  };

  const handleSaveAppointment = async () => {
    if(!apNotes.trim() || !apDate || !apTime) return;
    const body = {
      id: editAppointment?.id,
      title: apNotes.trim().slice(0, 50),
      contact_name: apContactName.trim(),
      contact_phone: apContactPhone.trim(),
      date: apDate,
      time: apTime,
      type: 'WhatsApp',
      status: apStatus,
      notes: apNotes.trim()
    };
    const method = editAppointment ? 'PUT' : 'POST';
    const r = await fetch('/api/appointments', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if(r.ok) {
      setAppointmentModal(false);
      setEditAppointment(null);
      setApTitle('');
      setApContactName('');
      setApContactPhone('');
      setApDate('');
      setApTime('');
      setApType('WhatsApp');
      setApStatus('agendado');
      setApNotes('');
      loadAppointments();
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if(!confirm('Deseja realmente excluir este agendamento?')) return;
    const r = await fetch('/api/appointments?id='+id, { method: 'DELETE' });
    if(r.ok) loadAppointments();
  };

  const handleUpdateAppointmentStatus = async (item: Appointment, newStatus: string) => {
    const r = await fetch('/api/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, status: newStatus })
    });
    if(r.ok) loadAppointments();
  };

  const startContactConv = async (name: string, phone: string) => {
    const tid = getTenantId();
    const tHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tid) tHeaders['x-tenant-id'] = tid;
    const r = await fetch('/api/crm/conversations',{method:'POST',headers:tHeaders,body:JSON.stringify({channel_identifier:phone.replace(/\D/g,''),contact_name:name,channel_type:'whatsapp',tenant_id:tid})});
    const d = await r.json();
    if (d.data) { setMenu('atendimento'); setSel(d.data); loadMsgs(d.data.id); setMobile(false); }
  };

  const getUnreadInternalCount = () => {
    if (!currentUserSim) return 0;
    let count = 0;
    internalUsers.forEach(u => {
      if (u.id === currentUserSim.id) return;
      if (menu === 'chat' && selectedInternalUser?.id === u.id) return;
      
      const lastReadStr = localStorage.getItem(`lastReadInternalChat_${u.id}`) || '1970-01-01T00:00:00.000Z';
      const lastReadTime = new Date(lastReadStr).getTime();
      
      const partnerMsgs = internalMsgs.filter(m => m.senderId === u.id && m.receiverId === currentUserSim.id);
      partnerMsgs.forEach(m => {
        if (new Date(m.createdAt).getTime() > lastReadTime) {
          count++;
        }
      });
    });
    return count;
  };

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { if (menu === 'produtos') loadProducts(productSearch, productCategory); }, [menu, loadProducts]);

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
    <div className="flex flex-col h-screen bg-[#f4f5f7]" style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <TrialBlock />
      <div className="flex flex-1 overflow-hidden">
      {/* ─── SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col items-center w-[68px] bg-white border-r border-gray-100 py-4 flex-shrink-0">
        {userRoleSim === 'admin' ? (
          <div className="relative mb-6">
            <button
              type="button"
              onClick={() => setDashboardMenuOpen(open => !open)}
              className="w-9 h-9 bg-[#0084c7] rounded-lg flex items-center justify-center text-white hover:bg-[#0070b0] transition"
              title="Menu do dashboard"
            >
              <Icon n="settings" s={20} />
            </button>
            {dashboardMenuOpen && (
              <div className="absolute left-12 top-0 z-[80] w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-2 shadow-xl">
                {[
                  ['Conversas', '/dashboard'],
                  ['Produtos', '/dashboard/products'],
                  ['Analytics', '/dashboard/analytics'],
                  ['Config AI', '/dashboard/ai-config'],
                  ['Configuracoes', '/dashboard/settings'],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDashboardMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {label}
                  </Link>
                ))}
                <div className="my-2 border-t border-gray-100" />
                <Link href="/" onClick={() => setDashboardMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Voltar ao site
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="h-9 mb-6" />
        )}
        <nav className="flex flex-col items-center gap-1 flex-1 overflow-y-auto no-scrollbar w-full py-1">
          {menuItems.map(m => {
            const isChat = m.k === 'chat';
            const unread = isChat ? getUnreadInternalCount() : 0;
            return (
              <button key={m.k} onClick={() => setMenu(m.k)}
                className={'relative w-12 h-12 flex items-center justify-center rounded-xl transition '+(menu===m.k?'bg-blue-50 text-[#0084c7]':'text-gray-400 hover:text-gray-600 hover:bg-gray-50')}
                title={m.l}>
                {menu===m.k && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0084c7] rounded-r-full" />}
                <Icon n={m.k} s={20} />
                {isChat && unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm border border-white">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto pb-2">
          <button
            onClick={() => {
              localStorage.removeItem('currentUser');
              localStorage.removeItem('userRole');
              window.location.href = '/auth/login';
            }}
            title="Sair da conta"
            className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ ATENDIMENTO ═══ */}
        {menu === 'atendimento' && <>
          {/* Conversation List */}
          <div className={(mobile?'flex':'hidden')+' md:flex flex-col w-[380px] bg-white border-r border-gray-100 flex-shrink-0'}>
            <div className="bg-[#0084c7] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/90 text-xs font-medium uppercase tracking-wider">Bem-vindo(a) à</p>
                <p className="text-white font-semibold text-lg leading-tight">VendaZap 360</p>
              </div>
              <div className="relative" ref={mobileMenuRef}>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(o => !o)}
                  className="p-1.5 rounded-lg text-white hover:bg-white/10 transition"
                  title="Menu de navegação"
                >
                  <Icon n="more" s={20} />
                </button>
                {mobileMenuOpen && (
                  <div className="absolute right-0 mt-2 z-[90] w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl text-gray-700">
                    {[
                      ['Conversas', '/dashboard'],
                      ['Produtos', '/dashboard/products'],
                      ['Analytics', '/dashboard/analytics'],
                      ['Config AI', '/dashboard/ai-config'],
                      ['Configurações', '/dashboard/settings'],
                    ].map(([label, href]) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 text-left"
                      >
                        {label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('userRole');
                        window.location.href = '/auth/login';
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 text-left"
                    >
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>
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
                          <div className="flex items-center gap-2 min-w-[200px]">
                            <button onClick={() => playAudio(m.id||String(i), m.content)}
                              className={'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition '+(activeAudio===m.id?'bg-[#0084c7] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                              {activeAudio === m.id ? <Icon n="pause" s={16}/> : <Icon n="play" s={16}/>}
                            </button>
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0084c7] rounded-full transition-all duration-200" style={{width: audioDuration > 0 && activeAudio === m.id ? ((audioProgress / audioDuration) * 100)+'%' : '0%'}} />
                            </div>
                            <span className="text-[11px] text-gray-400 font-mono w-10 text-right">{activeAudio === m.id ? fmtSec(Math.round(audioProgress)) : fmtSec(Math.round(audioDuration)) || '00:00'}</span>
                          </div>
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
                    <div className="relative flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-1.5">
                      {input.startsWith('/') && (() => {
                        const query = input.slice(1).toLowerCase();
                        const matched = quickResponsesList.filter(qr => qr.shortcut.toLowerCase().includes(query) || qr.title.toLowerCase().includes(query));
                        if (matched.length === 0) return null;
                        return (
                          <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Respostas Rápidas</span>
                              <span className="text-[9px] text-gray-400 font-medium">Clique para selecionar</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {matched.map(qr => (
                                <button
                                  key={qr.id}
                                  type="button"
                                  onClick={() => setInput(qr.content)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50/50 transition flex flex-col"
                                >
                                  <span className="text-xs font-mono font-bold text-[#0084c7]">/{qr.shortcut}</span>
                                  <span className="text-[11px] text-gray-500 font-medium truncate mt-0.5">{qr.title}</span>
                                  <span className="text-[10px] text-gray-400 truncate mt-0.5">{qr.content.slice(0, 60)}...</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
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

        {/* ═══ PRODUTOS ═══ */}
        {menu === 'produtos' && (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Catálogo de Produtos</h2>
                <p className="text-sm text-gray-500 mt-0.5">{products.length} produtos cadastrados • A IA consulta esse catálogo automaticamente</p>
              </div>
              <button onClick={() => { setEditProduct(null); setPName(''); setPSku(''); setPDesc(''); setPCat(''); setPPrice(''); setPCost(''); setPStock(''); setPActive(true); setPImage(''); setProductModal(true); }}
                className="flex items-center gap-2 bg-[#0084c7] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0070b0] transition">
                <Icon n="plus" s={16}/> Novo Produto
              </button>
            </div>

            {/* ── Import Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Importar via CSV / Excel</p>
                  <p className="text-xs text-gray-500">Arraste ou selecione uma planilha. Produtos existentes (mesmo SKU) serão atualizados automaticamente.</p>
                </div>
              </div>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${productImporting ? 'opacity-50 pointer-events-none' : 'border-gray-200 hover:border-[#0084c7] hover:bg-blue-50/30'}`}
                onClick={() => productFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleProductImport(e.dataTransfer.files); }}>
                <input ref={productFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleProductImport(e.target.files)} />
                <div className="text-3xl mb-2">{productImporting ? '⏳' : '📊'}</div>
                <p className="text-sm font-medium text-gray-700">{productImporting ? 'Processando...' : 'Clique ou arraste sua planilha aqui'}</p>
                <p className="text-xs text-gray-400 mt-1">Excel (.xlsx, .xls) ou CSV • Colunas: nome, sku, categoria, preço, custo, estoque, descrição</p>
              </div>

              {productImportStatus && (
                <p className={`mt-3 text-sm font-medium ${productImportStatus.startsWith('✅') ? 'text-green-700' : productImportStatus.startsWith('❌') ? 'text-red-600' : 'text-blue-600'}`}>
                  {productImportStatus}
                </p>
              )}

              {/* Preview antes de confirmar */}
              {productImportStep === 'preview' && productImportPreview.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Prévia (5 primeiras linhas)</p>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>{productImportColumns.slice(0, 8).map(col => <th key={col} className="px-3 py-2 text-left font-semibold text-gray-600 truncate max-w-[120px]">{col}</th>)}</tr>
                      </thead>
                      <tbody>
                        {productImportPreview.map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            {productImportColumns.slice(0, 8).map(col => <td key={col} className="px-3 py-2 text-gray-700 truncate max-w-[120px]">{String(row[col] ?? '')}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={confirmProductImport} disabled={productImporting}
                      className="bg-[#0084c7] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0070b0] disabled:opacity-60 transition">
                      {productImporting ? 'Importando...' : '✅ Confirmar Importação'}
                    </button>
                    <button onClick={() => { setProductImportStep('idle'); setProductImportStatus(''); setProductImportPreview([]); delete (window as any).__productImportRows; }}
                      className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Filtros ── */}
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Icon n="search" s={15} c="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
                <input type="text" placeholder="Buscar por nome, SKU, categoria..." value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); loadProducts(e.target.value, productCategory); }}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"/>
              </div>
              {productCategories.length > 0 && (
                <select value={productCategory} onChange={e => { setProductCategory(e.target.value); loadProducts(productSearch, e.target.value); }}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#0084c7]/20">
                  <option value="">Todas as categorias</option>
                  {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>

            {/* ── Lista de Produtos ── */}
            {products.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-gray-500 font-medium">Nenhum produto cadastrado ainda</p>
                <p className="text-sm text-gray-400 mt-1">Importe via planilha ou adicione manualmente</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Estoque</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50/60 transition ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-150 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0">📦</div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                              {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {p.category ? <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{p.category}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-gray-900">R$ {Number(p.base_price || 0).toFixed(2).replace('.', ',')}</p>
                          {p.cost_price && <p className="text-xs text-gray-400">Custo: R$ {Number(p.cost_price).toFixed(2).replace('.', ',')}</p>}
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className={`text-sm font-semibold ${(p.stock_quantity ?? 0) > 0 ? 'text-gray-700' : 'text-red-500'}`}>{p.stock_quantity ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {p.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => {
                              setEditProduct(p); setPName(p.name); setPSku(p.sku);
                              setPDesc(p.description || ''); setPCat(p.category || '');
                              setPPrice(String(p.base_price || ''));
                              setPCost(String(p.cost_price || ''));
                              setPStock(String(p.stock_quantity ?? ''));
                              setPActive(p.is_active);
                              setPImage(p.image_url || '');
                              setProductModal(true);
                            }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0084c7] transition" title="Editar">
                              <Icon n="edit" s={15}/>
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition" title="Excluir">
                              <Icon n="trash" s={15}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ MODAL PRODUTO ═══ */}
        {productModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setProductModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-900">{editProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => setProductModal(false)}><Icon n="x" s={20} c="text-gray-400 hover:text-gray-600"/></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome do Produto *</label>
                    <input type="text" value={pName} onChange={e => setPName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="Ex: Camiseta Básica Branca"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">SKU / Código</label>
                    <input type="text" value={pSku} onChange={e => setPSku(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 font-mono" placeholder="CAM-BCO-M"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Categoria</label>
                    <input type="text" value={pCat} onChange={e => setPCat(e.target.value)}
                      list="product-categories-list"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="Roupas"/>
                    <datalist id="product-categories-list">{productCategories.map(c => <option key={c} value={c}/>)}</datalist>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Preço de Venda (R$) *</label>
                    <input type="text" value={pPrice} onChange={e => setPPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="99,90"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Preço de Custo (R$)</label>
                    <input type="text" value={pCost} onChange={e => setPCost(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="45,00"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Estoque</label>
                    <input type="number" value={pStock} onChange={e => setPStock(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="0"/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Descrição</label>
                    <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 resize-none" placeholder="Detalhes, características, tamanhos disponíveis..."/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Foto do Produto (URL)</label>
                    <input type="text" value={pImage} onChange={e => setPImage(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" placeholder="Ex: https://meusite.com.br/fotos/camiseta.jpg"/>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer col-span-2">
                    <input type="checkbox" checked={pActive} onChange={e => setPActive(e.target.checked)} className="w-4 h-4 accent-[#0084c7]"/>
                    <span className="text-sm text-gray-700">Produto ativo (visível para a IA)</span>
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setProductModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleSaveProduct} className="flex-1 bg-[#0084c7] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#0070b0] transition">
                    {editProduct ? 'Salvar alterações' : 'Criar produto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAREFAS (CAMPANHAS POR TAG) ═══ */}
        {menu === 'tarefas' && (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-800 font-sans">Campanhas de Disparo (Tarefas)</h1>
                <p className="text-xs text-gray-400 mt-1">Dispare mensagens automáticas personalizadas para contatos agrupados por tags.</p>
              </div>
              <button
                onClick={() => {
                  setEditTask(null);
                  setTaskName('');
                  setTaskTagId(tags[0]?.id || '');
                  setTaskMessageTemplate('');
                  setTaskType('upsell');
                  setTaskChipInstance('b2zap');
                  setTaskModal(true);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold bg-[#0084c7] text-white px-4 py-2 rounded-lg hover:bg-[#0070b0] transition"
              >
                <Icon n="plus" s={16} /> Nova Tarefa
              </button>
            </div>

            {/* Section: Chips Auxiliares */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Chips Auxiliares de Disparo (Até 5)</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Cadastre números secundários para realizar os disparos das campanhas e proteger seu número principal contra bloqueios.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const slotNum = idx + 1;
                  const chip = chipsList.find(c => c.slot === slotNum) || {
                    slot: slotNum,
                    name: `Chip Auxiliar ${slotNum}`,
                    instanceName: `b2zap_chip_${slotNum}`,
                    status: 'disconnected',
                    phone: ''
                  };

                  return (
                    <div key={slotNum} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col justify-between hover:border-gray-200 transition">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Slot {slotNum}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${chip.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title={chip.status === 'connected' ? 'Conectado' : 'Desconectado'} />
                        </div>
                        <h4 className="font-bold text-xs text-gray-700 truncate mb-1">{chip.name}</h4>
                        {chip.phone ? (
                          <p className="text-[10px] text-gray-500 font-mono mb-3">{fmtPhone(chip.phone)}</p>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic mb-3">Sem número ativo</p>
                        )}
                      </div>

                      <div className="flex gap-1.5 mt-2">
                        {chip.status === 'connected' ? (
                          <button
                            onClick={() => handleDisconnectChip(slotNum)}
                            className="flex-1 text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg py-1.5 transition text-center"
                          >
                            Desconectar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnectChip(slotNum, chip.name)}
                            className="flex-1 text-[11px] font-semibold bg-[#0084c7] text-white hover:bg-[#0070b0] rounded-lg py-1.5 transition text-center"
                          >
                            Conectar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingChipSlot(slotNum);
                            setEditingChipName(chip.name);
                          }}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                          title="Editar Nome"
                        >
                          <Icon n="edit" s={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasksList.map(task => {
                const tagObj = tags.find(t => t.id === task.tagId);
                return (
                  <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0084c7]">
                              {task.type === 'upsell' ? 'Upsell' : task.type === 'retorno' ? 'Retorno' : 'Qualificação'}
                            </span>
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={task.chipInstance || 'b2zap'}>
                              🎛️ {task.chipInstance === 'b2zap' || !task.chipInstance ? 'Principal' : (chipsList.find(c => c.instanceName === task.chipInstance)?.name || 'Auxiliar')}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-base mt-1.5">{task.name}</h3>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditTask(task);
                              setTaskName(task.name);
                              setTaskTagId(task.tagId);
                              setTaskMessageTemplate(task.messageTemplate);
                              setTaskType(task.type);
                              setTaskChipInstance(task.chipInstance || 'b2zap');
                              setTaskModal(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            title="Editar"
                          >
                            <Icon n="edit" s={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Icon n="trash" s={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-1 font-medium">Tag Alvo:</p>
                        {tagObj ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: tagObj.color + '15', color: tagObj.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tagObj.color }} />
                            {tagObj.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Tag não encontrada</span>
                        )}
                      </div>

                      <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1 font-medium">Mensagem:</p>
                        <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">{task.messageTemplate}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-2">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="text-gray-400 font-medium">Progresso:</span>
                        <span className="font-semibold text-gray-700">
                          {task.successCount} / {task.runCount} enviados
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {task.status === 'running' || runningTaskId === task.id ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                              <svg className="animate-spin h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Enviando...
                            </span>
                          ) : task.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Concluído
                            </span>
                          ) : task.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Falhou
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Pendente
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRunTask(task.id)}
                          disabled={task.status === 'running' || runningTaskId !== null}
                          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white shadow-sm transition ${
                            task.status === 'running' || runningTaskId !== null
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          <Icon n="play" s={12} /> Disparar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {tasksList.length === 0 && (
              <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-gray-100 shadow-sm mt-4">
                <Icon n="tarefas" s={48} c="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-600 mb-1">Nenhuma campanha cadastrada</p>
                <p className="text-sm max-w-sm mx-auto">Crie campanhas e selecione tags de contatos para disparar mensagens em massa de forma inteligente.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ RESPOSTAS RÁPIDAS ═══ */}
        {menu === 'respostas' && (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-800 font-sans">Respostas Rápidas</h1>
                <p className="text-xs text-gray-400 mt-1">Configure atalhos de teclado (iniciados com "/") para responder clientes de forma ágil.</p>
              </div>
              <button
                onClick={() => {
                  setEditQuickResponse(null);
                  setQrShortcut('');
                  setQrTitle('');
                  setQrContent('');
                  setQrShowEmoji(false);
                  setQuickResponseModal(true);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold bg-[#0084c7] text-white px-4 py-2 rounded-lg hover:bg-[#0070b0] transition"
              >
                <Icon n="plus" s={16} /> Nova Resposta
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickResponsesList.map(qr => (
                <div key={qr.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-[#0084c7] bg-blue-50 px-2 py-0.5 rounded-md">
                          /{qr.shortcut}
                        </span>
                        <h3 className="font-bold text-gray-800 text-base mt-2">{qr.title}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditQuickResponse(qr);
                            setQrShortcut(qr.shortcut);
                            setQrTitle(qr.title);
                            setQrContent(qr.content);
                            setQrShowEmoji(false);
                            setQuickResponseModal(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          title="Editar"
                        >
                          <Icon n="edit" s={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuickResponse(qr.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Icon n="trash" s={16} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 min-h-[80px]">
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{qr.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {quickResponsesList.length === 0 && (
              <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-gray-100 shadow-sm mt-4">
                <Icon n="respostas" s={48} c="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-600 mb-1">Nenhuma resposta rápida cadastrada</p>
                <p className="text-sm max-w-sm mx-auto">Cadastre atalhos para usar no chat simplesmente digitando "/" durante o atendimento.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ AJUDA ═══ */}
        {menu === 'ajuda' && (() => {
          const helpSections = [
            {
              icon: '🚀', title: 'Primeiros Passos', color: 'text-blue-700', bg: 'bg-blue-50',
              items: [
                { q: 'Como criar outros usuários (vendedores)?', a: 'Vá em Configurações > Usuários > clique em "+ Novo usuário". Defina nome, e-mail, senha e perfil (Admin ou Vendedor).' },
                { q: 'Esqueci minha senha. O que faço?', a: 'Na tela de login, clique em "Esqueceu a senha?". Insira seu e-mail e você receberá um link de redefinição.' },
                { q: 'Como acesso as configurações do sistema?', a: 'Clique no ícone de engrenagem (⚙️) no topo da barra lateral. Ele abre o menu com Analytics, Config AI e Configurações.' },
              ]
            },
            {
              icon: '🤖', title: 'Agente de IA', color: 'text-purple-700', bg: 'bg-purple-50',
              items: [
                { q: 'O que é o Prompt Comercial?', a: 'Define a personalidade e missão do agente. Configure em Config AI > Prompt Comercial.' },
                { q: 'Para que servem os Prompts Positivo e Negativo?', a: 'Positivo: o que o agente DEVE fazer (mencionar parcelamento, focar em benefícios). Negativo: o que NÃO deve fazer (inventar informações, falar de concorrentes).' },
                { q: 'Como faço para o agente conhecer meus produtos?', a: 'Em Config AI > Catálogo de Produtos, faça upload da planilha Excel (.xlsx) ou CSV. O sistema indexa automaticamente.' },
                { q: 'Como atualizo os preços dos produtos?', a: 'Na lista de arquivos indexados, clique no 🗑️ do arquivo antigo para excluí-lo, depois faça upload da planilha atualizada.' },
                { q: 'Como pausar as respostas automáticas?', a: 'Em Config AI, clique no toggle "Respostas automáticas ativas" no canto superior direito.' },
              ]
            },
            {
              icon: '💬', title: 'Conversas e WhatsApp', color: 'text-green-700', bg: 'bg-green-50',
              items: [
                { q: 'O que são as tags de contato?', a: 'Etiquetas para organizar seus contatos (ex: "Lead Quente", "Cliente VIP"). Crie e edite em Configurações.' },
                { q: 'Como usar respostas rápidas?', a: 'Cadastre atalhos em Respostas Rápidas. No chat, digite "/" para inserir automaticamente.' },
                { q: 'O que é o Kanban?', a: 'Visualização de conversas organizadas por tags em colunas, estilo quadro de tarefas.' },
              ]
            },
            {
              icon: '🚨', title: 'Problemas Comuns', color: 'text-red-700', bg: 'bg-red-50',
              items: [
                { q: 'Não vejo o menu de Configurações.', a: 'Seu usuário pode estar com perfil "Vendedor". Peça ao administrador para alterar para "Admin" em Configurações > Usuários. Depois faça logout e entre novamente.' },
                { q: 'O agente não está respondendo no WhatsApp.', a: 'Verifique: (1) Respostas Automáticas ativas em Config AI; (2) instância WhatsApp conectada; (3) chave da OpenAI correta.' },
                { q: 'O upload da planilha falhou.', a: 'Certifique-se que o arquivo é .xlsx, .xls ou .csv e tem menos de 10MB. Planilhas grandes podem ser divididas.' },
                { q: 'O agente deu informação errada sobre produto.', a: 'Exclua o arquivo antigo nos arquivos indexados e faça upload da versão corrigida.' },
              ]
            },
          ];

          return (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0084c7] mb-1">Central de Ajuda</p>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Como podemos ajudar?</h2>

                {/* Search */}
                <div className="relative mb-6">
                  <Icon n="search" s={15} c="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="help-search"
                    placeholder="Pesquisar dúvidas..."
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      const allAccordions = document.querySelectorAll('[data-help-item]');
                      const allSections = document.querySelectorAll('[data-help-section]');
                      allAccordions.forEach((el: any) => {
                        const text = el.getAttribute('data-help-item')?.toLowerCase() || '';
                        el.style.display = !q || text.includes(q) ? '' : 'none';
                      });
                      allSections.forEach((el: any) => {
                        const visible = el.querySelectorAll('[data-help-item]:not([style*="none"])');
                        el.style.display = visible.length > 0 || !q ? '' : 'none';
                      });
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#0084c7] focus:ring-2 focus:ring-[#0084c7]/10"
                  />
                </div>

                <div className="space-y-5">
                  {helpSections.map((section) => (
                    <div key={section.title} data-help-section className={`rounded-xl border p-5 ${section.bg}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">{section.icon}</span>
                        <h3 className={`font-bold text-sm ${section.color}`}>{section.title}</h3>
                      </div>
                      <div className="rounded-lg bg-white px-4 divide-y divide-gray-100">
                        {section.items.map((item) => (
                          <HelpAccordion key={item.q} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white p-5 text-center">
                  <p className="text-sm font-semibold text-gray-700">Não encontrou o que precisava?</p>
                  <p className="mt-1 text-sm text-gray-500">Entre em contato com o suporte pelo WhatsApp ou e-mail do seu contrato.</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ CHAT INTERNO ═══ */}
        {menu === 'chat' && (() => {
          const chatPartners = internalUsers.filter(u => u.id !== currentUserSim?.id);
          const filteredPartners = chatPartners.filter(u => {
            const q = internalSearch.toLowerCase();
            return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
          });

          const currentChatMsgs = internalMsgs.filter(m => 
            (m.senderId === currentUserSim?.id && m.receiverId === selectedInternalUser?.id) ||
            (m.senderId === selectedInternalUser?.id && m.receiverId === currentUserSim?.id)
          ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          return (
            <div className="flex-1 flex overflow-hidden">
              {/* Partner List */}
              <div className="w-80 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h1 className="text-lg font-bold text-gray-800 mb-3">Chat Interno</h1>
                  <div className="relative">
                    <Icon n="search" s={15} c="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="text"
                      placeholder="Buscar colega..."
                      value={internalSearch}
                      onChange={e => setInternalSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#0084c7]/20 placeholder:text-gray-300"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredPartners.map(u => {
                    const partnerUnread = (() => {
                      if (!currentUserSim) return 0;
                      if (selectedInternalUser?.id === u.id) return 0;
                      const lastReadStr = localStorage.getItem(`lastReadInternalChat_${u.id}`) || '1970-01-01T00:00:00.000Z';
                      const lastReadTime = new Date(lastReadStr).getTime();
                      return internalMsgs.filter(m => m.senderId === u.id && m.receiverId === currentUserSim.id && new Date(m.createdAt).getTime() > lastReadTime).length;
                    })();

                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedInternalUser(u)}
                        className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition \${selectedInternalUser?.id === u.id ? 'bg-blue-50/40 border-l-[3px] border-l-[#0084c7]' : ''}`}
                      >
                        <Avatar name={u.name} size={10} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full \${u.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-600'}`}>
                            {u.role}
                          </span>
                          {partnerUnread > 0 && (
                            <span className="w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm">
                              {partnerUnread}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredPartners.length === 0 && (
                    <div className="text-center text-gray-400 py-12 text-xs">Nenhum colega encontrado</div>
                  )}
                </div>
              </div>

              {/* Message Pane */}
              <div className="flex-1 flex flex-col bg-[#f4f5f7]">
                {!selectedInternalUser ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-sm">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon n="chat" s={36} c="text-gray-400" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-700 mb-1">Conversas de Equipe</h2>
                      <p className="text-xs text-gray-400">Selecione um colega ao lado para iniciar uma conversa interna e colaborar em tempo real.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
                      <Avatar name={selectedInternalUser.name} size={10} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{selectedInternalUser.name}</p>
                        <p className="text-xs text-green-600 font-medium">Online</p>
                      </div>
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full \${selectedInternalUser.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {selectedInternalUser.role === 'admin' ? 'Admin' : 'Vendedor'}
                      </span>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,#e2e4e9 1px,transparent 0)', backgroundSize: '20px 20px' }}>
                      {currentChatMsgs.length === 0 ? (
                        <div className="text-center text-gray-400 text-xs py-12">Nenhuma mensagem. Comece a conversa!</div>
                      ) : (
                        currentChatMsgs.map((m, i) => {
                          const isMe = m.senderId === currentUserSim?.id;
                          return (
                            <div key={m.id || i} className={`flex \${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl \${isMe ? 'bg-[#0084c7]' : 'bg-white'} \${isMe ? 'text-white rounded-tr-sm' : 'text-gray-800 shadow-sm rounded-tl-sm'}`}>
                                <p>{m.content}</p>
                                <p className={`text-[9px] mt-1.5 text-right \${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Input */}
                    <div className="bg-white border-t border-gray-200 px-5 py-3">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-1.5">
                        <input
                          type="text"
                          placeholder="Digite sua mensagem interna..."
                          value={internalInput}
                          onChange={e => setInternalInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendInternalMsg();
                            }
                          }}
                          className="flex-1 bg-transparent text-sm outline-none py-1.5 placeholder:text-gray-300 text-gray-800"
                        />
                        <button
                          onClick={handleSendInternalMsg}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition \${internalInput.trim() ? 'bg-[#0084c7] text-white shadow-sm hover:bg-[#0070b0]' : 'bg-gray-200 text-gray-400'}`}
                        >
                          <Icon n="send" s={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══ RESULTADOS ═══ */}
        {menu === 'resultados' && (() => {
          return (
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 font-sans text-gray-800">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800">Resultados e Métricas</h1>
                <p className="text-xs text-gray-400 mt-1">Análise comparativa em tempo real entre o Agente de IA e o Atendimento Humano.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Atendimentos Totais</span>
                    <span className="text-[11px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded">+12.4%</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-700">1.842</h3>
                  <p className="text-[11px] text-gray-400 mt-1.5">Média de 65 atendimentos/dia</p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resoluções por IA</span>
                    <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Meta: 80%</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-700">84.6%</h3>
                  <p className="text-[11px] text-gray-400 mt-1.5">1.558 finalizados sem humano</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tempo de Resposta (TMR)</span>
                    <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">-92%</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-700">6.2s</h3>
                  <p className="text-[11px] text-gray-400 mt-1.5">Humano: ~4.5 min • IA: ~2.1 seg</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Satisfação (CSAT)</span>
                    <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">★ 4.8</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-700">96.2%</h3>
                  <p className="text-[11px] text-gray-400 mt-1.5">Baseado em 510 avaliações</p>
                </div>
              </div>

              {/* Main dashboard content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Column 1 & 2: Compare Bars */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
                  <h3 className="font-bold text-gray-800 text-sm mb-5">Divisão Operacional: IA vs Humano</h3>
                  
                  <div className="space-y-6">
                    {/* Resolution Rate */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                        <span>Resolução Autônoma</span>
                        <span>IA (84.6%) vs Humano (15.4%)</span>
                      </div>
                      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-[#0084c7]" style={{ width: '84.6%' }} />
                        <div className="h-full bg-amber-500" style={{ width: '15.4%' }} />
                      </div>
                    </div>

                    {/* Qualification Rate */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                        <span>Qualificação de Leads (Intenção Alta)</span>
                        <span>IA (72.3%) vs Humano (27.7%)</span>
                      </div>
                      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-[#0084c7]" style={{ width: '72.3%' }} />
                        <div className="h-full bg-amber-500" style={{ width: '27.7%' }} />
                      </div>
                    </div>

                    {/* Upsell / Conversion */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                        <span>Conversões de Campanhas Automáticas</span>
                        <span>Disparos por Tag (91%) vs Manual (9%)</span>
                      </div>
                      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-[#0084c7]" style={{ width: '91%' }} />
                        <div className="h-full bg-amber-500" style={{ width: '9%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6 pt-4 border-t border-gray-50 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="w-3 h-3 rounded bg-[#0084c7]" />
                      <span>Agente de IA (VendaZap)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="w-3 h-3 rounded bg-amber-500" />
                      <span>Operador Humano</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Intent/Tag Distribution */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-800 text-sm mb-5">Funil de Leads IA</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          Qualificado (Comprar)
                        </span>
                        <span className="font-bold">62%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '62%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          Interessado (Dúvidas)
                        </span>
                        <span className="font-bold">23%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '23%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          Suporte (Outros)
                        </span>
                        <span className="font-bold">10%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: '10%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                          Sem Interesse
                        </span>
                        <span className="font-bold">5%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400" style={{ width: '5%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent qualifications */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 text-sm mb-4">Últimas Leads Qualificadas pelo Agente de IA</h3>
                <div className="divide-y divide-gray-100">
                  {[
                    { name: 'Ricardo Mendes', phone: '+55 11 99887-2211', intent: 'Plano Premium', date: 'Hoje às 15:42', score: 'Alta' },
                    { name: 'Ana Cláudia Cruz', phone: '+55 21 98112-4040', intent: 'Demonstração Agendada', date: 'Hoje às 14:15', score: 'Alta' },
                    { name: 'Marcos Vinícius', phone: '+55 31 99221-5080', intent: 'Fechamento de Contrato', date: 'Ontem às 18:30', score: 'Crítica' },
                  ].map((l, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{l.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{l.phone} • {l.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#0084c7]">{l.intent}</span>
                        <span className={`block text-[10px] font-bold mt-1 uppercase \${l.score === 'Crítica' ? 'text-red-500' : 'text-green-500'}`}>
                          Intenção: {l.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ AGENDAMENTOS ═══ */}
        {menu === 'agendamentos' && (() => {
          const localDate = new Date();
          const year = localDate.getFullYear();
          const month = String(localDate.getMonth() + 1).padStart(2, '0');
          const day = String(localDate.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`;

          const totalAps = appointmentsList.length;
          const agendadosAps = appointmentsList.filter(a => a.status === 'agendado').length;
          const enviadosAps = appointmentsList.filter(a => a.status === 'enviado' || a.status === 'concluido').length;
          const falhosAps = appointmentsList.filter(a => a.status === 'failed').length;

          const filteredAppointments = appointmentsList.filter(a => {
            const matchStatus = apFilterStatus === 'todos' || a.status === apFilterStatus;
            const q = apSearchQuery.toLowerCase();
            const matchSearch = !q || a.title.toLowerCase().includes(q) || a.notes.toLowerCase().includes(q) || a.contact_name.toLowerCase().includes(q) || a.contact_phone.includes(q);
            return matchStatus && matchSearch;
          });

          return (
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-800 font-sans">Agendamento de Mensagens por WhatsApp</h1>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Deixe mensagens automáticas agendadas para serem enviadas aos clientes na data e horário marcados.</p>
                </div>
                <button
                  onClick={() => {
                    setEditAppointment(null);
                    setApTitle('');
                    setApContactName('');
                    setApContactPhone('');
                    setApDate(todayStr);
                    setApTime('');
                    setApType('WhatsApp');
                    setApStatus('agendado');
                    setApNotes('');
                    setAppointmentModal(true);
                  }}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-[#0084c7] text-white px-4 py-2 rounded-lg hover:bg-[#0070b0] transition shadow-sm"
                >
                  <Icon n="plus" s={16} /> Agendar Mensagem
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0084c7]">
                    <Icon n="agendamentos" s={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Total Geral</p>
                    <h3 className="text-xl font-bold text-gray-700">{totalAps}</h3>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <span className="text-lg">📅</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Agendados</p>
                    <h3 className="text-xl font-bold text-gray-700">{agendadosAps}</h3>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <Icon n="check" s={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Enviados</p>
                    <h3 className="text-xl font-bold text-gray-700">{enviadosAps}</h3>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                    <Icon n="x" s={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Falhas</p>
                    <h3 className="text-xl font-bold text-gray-700">{falhosAps}</h3>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Icon n="search" s={16} c="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por mensagem, nome ou telefone..."
                    value={apSearchQuery}
                    onChange={e => setApSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 placeholder:text-gray-400"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <span>Status:</span>
                    <select
                      value={apFilterStatus}
                      onChange={e => setApFilterStatus(e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white font-medium text-gray-700"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="agendado">Agendado</option>
                      <option value="enviado">Enviado</option>
                      <option value="failed">Falhou</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid / List */}
              {filteredAppointments.length === 0 ? (
                <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Icon n="agendamentos" s={48} c="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600 mb-1">Nenhum agendamento encontrado</p>
                  <p className="text-sm max-w-sm mx-auto mb-4">Crie novos agendamentos de mensagens ou altere seus filtros de busca.</p>
                  <button
                    onClick={() => {
                      setEditAppointment(null);
                      setApTitle('');
                      setApContactName('');
                      setApContactPhone('');
                      setApDate(todayStr);
                      setApTime('');
                      setApType('WhatsApp');
                      setApStatus('agendado');
                      setApNotes('');
                      setAppointmentModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0084c7] text-white px-4 py-2 rounded-lg hover:bg-[#0070b0] transition"
                  >
                    + Agendar Mensagem
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAppointments.map(ap => {
                    const isToday = ap.date === todayStr;

                    // Status-based formatting
                    let statusBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
                    let statusLeftBorder = 'border-l-blue-500';
                    let statusLabel = 'Agendado';
                    if (ap.status === 'enviado' || ap.status === 'concluido') {
                      statusBadgeClass = 'bg-green-50 text-green-700 border border-green-200';
                      statusLeftBorder = 'border-l-green-500';
                      statusLabel = 'Enviado';
                    } else if (ap.status === 'failed') {
                      statusBadgeClass = 'bg-red-50 text-red-700 border border-red-200';
                      statusLeftBorder = 'border-l-red-500';
                      statusLabel = 'Falhou';
                    } else if (ap.status === 'cancelado') {
                      statusBadgeClass = 'bg-gray-50 text-gray-500 border border-gray-200';
                      statusLeftBorder = 'border-l-gray-400';
                      statusLabel = 'Cancelado';
                    }

                    // Format date (YYYY-MM-DD -> DD/MM/YYYY)
                    const [y, m, d] = ap.date.split('-');
                    const fmtDate = (d && m && y) ? `${d}/${m}/${y}` : ap.date;

                    return (
                      <div
                        key={ap.id}
                        className={`bg-white rounded-xl border-l-[4px] ${statusLeftBorder} border-y border-r border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition relative`}
                      >
                        {isToday && ap.status === 'agendado' && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse z-10">
                            Hoje
                          </span>
                        )}
                        <div>
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusBadgeClass}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditAppointment(ap);
                                  setApTitle(ap.title);
                                  setApContactName(ap.contact_name);
                                  setApContactPhone(ap.contact_phone);
                                  setApDate(ap.date);
                                  setApTime(ap.time);
                                  setApType(ap.type);
                                  setApStatus(ap.status);
                                  setApNotes(ap.notes);
                                  setAppointmentModal(true);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-100"
                                title="Editar"
                              >
                                <Icon n="edit" s={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAppointment(ap.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-100"
                                title="Excluir"
                              >
                                <Icon n="trash" s={14} />
                              </button>
                            </div>
                          </div>

                          {/* WhatsApp Bubble Style Message Content */}
                          <div className="bg-[#e8fbf3] border border-[#c6f6e5] rounded-xl rounded-tr-none p-4 mb-4 text-sm text-gray-800 shadow-sm relative mt-2">
                            <div className="absolute right-[-6px] top-0 w-3 h-3 bg-[#e8fbf3] border-t border-r border-[#c6f6e5] rotate-45" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
                            <p className="whitespace-pre-wrap leading-relaxed font-sans text-gray-700 font-medium">{ap.notes || ap.title}</p>
                          </div>

                          {/* Client details */}
                          <div className="space-y-1.5 mb-4 border-t border-gray-50 pt-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Icon n="contatos" s={13} c="text-gray-400" />
                              <span className="font-semibold text-gray-800">Destinatário: {ap.contact_name || 'Sem nome'}</span>
                            </div>
                            {ap.contact_phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Icon n="phone" s={13} c="text-gray-400" />
                                <span className="font-mono text-gray-700">{fmtPhone(ap.contact_phone)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                              <span className="text-gray-400">📅</span>
                              <span className="text-gray-700">Disparo em: {fmtDate} às {ap.time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#25d366]" />
                            WhatsApp Msg
                          </span>

                          <div className="flex gap-1.5">
                            {ap.contact_phone && (
                              <button
                                onClick={() => startContactConv(ap.contact_name || 'Agendamento', ap.contact_phone)}
                                className="flex items-center gap-1 text-[11px] font-semibold bg-[#25d366] text-white hover:bg-[#20ba5a] rounded-lg px-2.5 py-1.5 shadow-sm transition"
                                title="Conversar no WhatsApp"
                              >
                                <Icon n="chat" s={12} /> Conversar
                              </button>
                            )}

                            {ap.status === 'agendado' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(ap, 'enviado')}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                                  title="Marcar como Enviado"
                                >
                                  <Icon n="check" s={14} />
                                </button>
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(ap, 'cancelado')}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                  title="Marcar como Cancelado"
                                >
                                  <Icon n="x" s={14} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(ap, 'agendado')}
                                className="text-[11px] font-semibold text-[#0084c7] hover:underline"
                              >
                                Reagendar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
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

      {/* ═══ TASK MODAL ═══ */}
      {taskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setTaskModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={() => setTaskModal(false)}>
                <Icon n="x" s={20} c="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nome da Tarefa / Campanha</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="Ex: Campanha de Upsell - Junho"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de Campanha</label>
                <select
                  value={taskType}
                  onChange={e => setTaskType(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white"
                >
                  <option value="upsell">Upsell (Venda adicional)</option>
                  <option value="retorno">Retorno (Contatos inativos)</option>
                  <option value="qualificacao">Qualificação (Lead qualification)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">WhatsApp de Disparo (Chip)</label>
                <select
                  value={taskChipInstance}
                  onChange={e => setTaskChipInstance(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white"
                >
                  <option value="b2zap">Chip Principal / Oficial (b2zap)</option>
                  {chipsList.filter(c => c.status === 'connected').map(c => (
                    <option key={c.slot} value={c.instanceName}>
                      {c.name} ({fmtPhone(c.phone)})
                    </option>
                  ))}
                  {chipsList.filter(c => c.status !== 'connected').map(c => (
                    <option key={c.slot} value={c.instanceName} disabled>
                      {c.name} (Desconectado)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tag Alvo (Contatos que receberão)</label>
                <select
                  value={taskTagId}
                  onChange={e => setTaskTagId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white"
                >
                  <option value="" disabled>Selecione uma tag</option>
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {tags.length === 0 && (
                  <p className="text-[11px] text-red-500 mt-1">Crie pelo menos uma Tag na tela de "Tags" antes de criar tarefas.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Modelo de Mensagem (WhatsApp)</label>
                <textarea
                  value={taskMessageTemplate}
                  onChange={e => setTaskMessageTemplate(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 font-sans resize-none"
                  placeholder="Olá {nome}, tudo bem? Temos uma oferta especial..."
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-400 bg-gray-50 rounded p-2 border border-gray-100">
                  <Icon n="info" s={14} c="text-gray-400" />
                  <span>Dica: Use <strong>{'{nome}'}</strong> para inserir o nome do contato automaticamente.</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setTaskModal(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTask}
                disabled={!taskName.trim() || !taskTagId || !taskMessageTemplate.trim()}
                className="flex-1 bg-[#0084c7] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#0070b0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QR CODE / PAIRING CHIP MODAL ═══ */}
      {pairingSlot !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setPairingSlot(null); setPairingQr(null); loadChipsList(); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl text-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
              <h3 className="font-semibold text-sm text-gray-800">Conectar Slot {pairingSlot}</h3>
              <button onClick={() => { setPairingSlot(null); setPairingQr(null); loadChipsList(); }}>
                <Icon n="x" s={18} c="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Leia o código abaixo usando o WhatsApp (Aparelhos Conectados) para conectar este chip auxiliar.</p>
            
            <div className="flex items-center justify-center min-h-[220px] bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
              {pairingQr ? (
                <img src={pairingQr} alt="QR Code WhatsApp" className="max-w-[200px] h-auto shadow-md rounded border border-gray-100 bg-white" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="animate-spin h-8 w-8 text-[#0084c7]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs">Gerando QR Code...</span>
                </div>
              )}
            </div>

            <button
              onClick={() => { setPairingSlot(null); setPairingQr(null); loadChipsList(); }}
              className="w-full mt-4 bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg text-xs hover:bg-gray-200 transition"
            >
              Fechar & Atualizar Status
            </button>
          </div>
        </div>
      )}

      {/* ═══ RENAME CHIP MODAL ═══ */}
      {editingChipSlot !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingChipSlot(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <h3 className="font-semibold text-sm text-gray-800">Editar Nome do Chip {editingChipSlot}</h3>
              <button onClick={() => setEditingChipSlot(null)}><Icon n="x" s={18} c="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do Chip / Linha</label>
                <input
                  type="text"
                  value={editingChipName}
                  onChange={e => setEditingChipName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="Ex: Chip Queima 1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditingChipSlot(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleRenameChip} className="flex-1 bg-[#0084c7] text-white rounded-lg py-2 text-xs font-medium hover:bg-[#0070b0]">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUICK RESPONSE MODAL ═══ */}
      {quickResponseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setQuickResponseModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <h3 className="font-semibold text-lg">{editQuickResponse ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}</h3>
              <button onClick={() => setQuickResponseModal(false)}>
                <Icon n="x" s={20} c="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Atalho (sem a barra "/")</label>
                <input
                  type="text"
                  value={qrShortcut}
                  onChange={e => setQrShortcut(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="ex: boas-vindas, suporte"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Este será o atalho digitado no chat (ex: /boas-vindas).</span>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Título Identificador</label>
                <input
                  type="text"
                  value={qrTitle}
                  onChange={e => setQrTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="Ex: Mensagem de Boas-vindas Padrão"
                />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500">Conteúdo da Resposta</label>
                  <button
                    type="button"
                    onClick={() => setQrShowEmoji(!qrShowEmoji)}
                    className="text-gray-400 hover:text-gray-600 p-1 flex items-center gap-1 text-xs"
                  >
                    <Icon n="emoji" s={14} /> Emojis
                  </button>
                </div>
                
                {qrShowEmoji && (
                  <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 grid grid-cols-8 gap-1 z-50 w-64 max-h-40 overflow-y-auto">
                    {EMOJIS.map((e, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQrContent(prev => prev + e);
                          setQrShowEmoji(false);
                        }}
                        className="hover:bg-gray-100 rounded p-1 text-lg leading-none"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={qrContent}
                  onChange={e => setQrContent(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 font-sans resize-none"
                  placeholder="Digite a resposta pronta aqui..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setQuickResponseModal(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuickResponse}
                disabled={!qrTitle.trim() || !qrContent.trim() || !qrShortcut.trim()}
                className="flex-1 bg-[#0084c7] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#0070b0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editQuickResponse ? 'Salvar Alterações' : 'Criar Resposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ APPOINTMENT MODAL ═══ */}
      {appointmentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setAppointmentModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <h3 className="font-semibold text-lg">{editAppointment ? 'Editar Mensagem Agendada' : 'Agendar Nova Mensagem'}</h3>
              <button onClick={() => setAppointmentModal(false)}>
                <Icon n="x" s={20} c="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Opcional: Selecionar Contato Existente */}
              {!editAppointment && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Vincular Contato Cadastrado (Opcional)</label>
                  <select
                    onChange={e => {
                      const selectedPhone = e.target.value;
                      if (selectedPhone) {
                        const contact = contacts.find(c => c.phone === selectedPhone);
                        if (contact) {
                          setApContactName(contact.name);
                          setApContactPhone(contact.phone);
                        }
                      } else {
                        setApContactName('');
                        setApContactPhone('');
                      }
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white"
                  >
                    <option value="">-- Contato Manual / Novo --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.phone}>
                        {c.name} ({fmtPhone(c.phone)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do Cliente / Contato</label>
                  <input
                    type="text"
                    value={apContactName}
                    onChange={e => setApContactName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">WhatsApp do Cliente (Número)</label>
                  <input
                    type="text"
                    value={apContactPhone}
                    onChange={e => setApContactPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                    placeholder="Ex: +5565992774293"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Data de Envio</label>
                  <input
                    type="date"
                    value={apDate}
                    onChange={e => setApDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Horário de Envio</label>
                  <input
                    type="time"
                    value={apTime}
                    onChange={e => setApTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                <select
                  value={apStatus}
                  onChange={e => setApStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white"
                >
                  <option value="agendado">Agendado</option>
                  <option value="enviado">Enviado</option>
                  <option value="failed">Falhou</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Mensagem do WhatsApp (Envio Automático)</label>
                <textarea
                  value={apNotes}
                  onChange={e => setApNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 font-sans resize-none"
                  placeholder="Escreva a mensagem aqui. Ex: Olá {nome}, você pediu para falar com você na quinta a tarde, como vai?"
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-400 bg-gray-50 rounded p-2 border border-gray-100">
                  <Icon n="info" s={14} c="text-gray-400" />
                  <span>Dica: Use <strong>{'{nome}'}</strong> para inserir o nome do contato automaticamente no envio.</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setAppointmentModal(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAppointment}
                disabled={!apNotes.trim() || !apDate || !apTime}
                className="flex-1 bg-[#0084c7] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#0070b0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editAppointment ? 'Salvar Alterações' : 'Criar Agendamento'}
              </button>
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
    </div>
  );
}
