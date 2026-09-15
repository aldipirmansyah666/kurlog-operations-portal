'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  MapPin,
  Wallet,
  Clock,
  CheckCheck,
  CircleDot,
  XCircle,
  Timer,
  User,
  Zap,
  FileText,
  ShieldAlert,
} from 'lucide-react';

type CaseStatus = 'Open' | 'In Progress' | 'Resolved';
type FilterStatus = 'Semua' | CaseStatus;

interface ChatMessage {
  id: string;
  sender: 'agent' | 'cs';
  text: string;
  time: string; // HH:mm
  dateLabel: string; // Today, etc
}

interface ChatRoom {
  id: string;
  agenName: string;
  kodeLoket: string;
  waNumber: string;
  avatarInitials: string;
  area: string;
  kodeWilayah: string;
  bailoutStatus: string;
  online: boolean;
  caseStatus: CaseStatus;
  unread: number;
  lastPreview: string;
  lastTime: string;
  messages: ChatMessage[];
}

const QUICK_REPLIES = [
  'Paket Sedang Ditelusuri',
  'Mohon Lampirkan Bukti Setoran',
  'Kendala Sudah Selesai',
  'Mohon Tunggu Konfirmasi Pusat',
  'Terima Kasih Pak, Segera Kami Bantu',
  'Mohon Simpan Nomor Ini Sebagai Kontak',
];

const MOCK_CHATS: ChatRoom[] = [
  {
    id: 'chat-1',
    agenName: 'CIPTA USAHA MAKMUR',
    kodeLoket: 'SBPAYS-CA-001',
    waNumber: '+62 822-1756-9689',
    avatarInitials: 'CM',
    area: 'Jakarta Barat - Kalideres',
    kodeWilayah: 'JKT-CA',
    bailoutStatus: 'Minus Rp -1.2jt (H-1)',
    online: true,
    caseStatus: 'Open',
    unread: 2,
    lastPreview: 'Pak, paket P2600123 belum dibagging ya? Mohon bantuannya...',
    lastTime: '09:12',
    messages: [
      { id: 'm1', sender: 'cs', text: 'Selamat pagi pak, mohon maaf mengganggu waktunya pak, ada paket di agen bapak CIPTA USAHA MAKMUR pada Tanggal 14/09/2026 yang belum dibagging ya pak? Mohon dibantu untuk segera dibagging.', time: '09:00', dateLabel: 'Hari ini' },
      { id: 'm2', sender: 'agent', text: 'Siap pak, saya cek dulu ya. Resi P2600123 sudah saya bagging tadi pagi tapi sistem belum update?', time: '09:08', dateLabel: 'Hari ini' },
      { id: 'm3', sender: 'agent', text: 'Pak, paket P2600123 belum dibagging ya? Mohon bantuannya, customer komplain', time: '09:12', dateLabel: 'Hari ini' },
    ],
  },
  {
    id: 'chat-2',
    agenName: 'CV. MITRA PERDANA INDONESIA',
    kodeLoket: 'SBPAYS-MPI-00',
    waNumber: '+62 812-3456-7890',
    avatarInitials: 'MP',
    area: 'Bandung - Kiaracondong',
    kodeWilayah: 'BDG-MPI',
    bailoutStatus: 'Minus Rp -1.507.495.541',
    online: false,
    caseStatus: 'In Progress',
    unread: 1,
    lastPreview: 'Minus bailout kemarin sudah saya transfer bukti terlampir...',
    lastTime: '08:45',
    messages: [
      { id: 'm1', sender: 'cs', text: "Assalamu'alaikum, Dear Kang Diwa & Mas Endi, berikut kami sampaikan minus pada tanggal 13 Sep 2026 sebesar Rp -1.507.495.541. Mohon bantuan pelimpahannya sebelum 09.00 WIB.", time: '08:30', dateLabel: 'Hari ini' },
      { id: 'm2', sender: 'agent', text: 'Waalaikumsalam, sudah saya transfer jam 08:20 via BCA. Bukti terlampir ya pak, mohon cek.', time: '08:45', dateLabel: 'Hari ini' },
      { id: 'm3', sender: 'cs', text: 'Terima kasih pak, sedang kami telusuri di mutasi. Mohon tunggu konfirmasi pusat.', time: '08:47', dateLabel: 'Hari ini' },
    ],
  },
  {
    id: 'chat-3',
    agenName: 'TOKO SUMBER REJEKI',
    kodeLoket: 'SBPAYS-TSR-012',
    waNumber: '+62 853-1122-3344',
    avatarInitials: 'SR',
    area: 'Surabaya - Rungkut',
    kodeWilayah: 'SBY-TSR',
    bailoutStatus: 'Lunas',
    online: true,
    caseStatus: 'Open',
    unread: 3,
    lastPreview: 'Resi SHPE998877 status RETUR tapi customer bilang belum terima...',
    lastTime: '07:30',
    messages: [
      { id: 'm1', sender: 'agent', text: 'Selamat pagi CS, resi SHPE998877 status di sistem RETUR tapi customer bilang belum terima paket. Mohon bantu cek?', time: '07:25', dateLabel: 'Hari ini' },
      { id: 'm2', sender: 'agent', text: 'Kronologi: paket dikirim 12 Sep, kurir info alamat tidak ditemukan', time: '07:28', dateLabel: 'Hari ini' },
      { id: 'm3', sender: 'agent', text: 'Resi SHPE998877 status RETUR tapi customer bilang belum terima, apakah bisa redelivery?', time: '07:30', dateLabel: 'Hari ini' },
    ],
  },
  {
    id: 'chat-4',
    agenName: 'AGUSONO',
    kodeLoket: 'SBPAYS-AGS-009',
    waNumber: '+62 812-0000-1111',
    avatarInitials: 'AG',
    area: 'Yogyakarta - Bantul',
    kodeWilayah: 'YOG-AGS',
    bailoutStatus: 'Minus Rp -350.000',
    online: false,
    caseStatus: 'Resolved',
    unread: 0,
    lastPreview: 'Terima kasih CS, kendala sudah selesai. Paket sudah diambil customer.',
    lastTime: 'Kemarin',
    messages: [
      { id: 'm1', sender: 'agent', text: 'Paket P2600999 status HOLD karena alamat kurang lengkap, mohon arahan', time: '16:20', dateLabel: 'Kemarin' },
      { id: 'm2', sender: 'cs', text: 'Baik pak Agusono, mohon lampirkan foto KTP penerima untuk verifikasi alamat lengkap ya pak.', time: '16:35', dateLabel: 'Kemarin' },
      { id: 'm3', sender: 'agent', text: 'Terima kasih CS, kendala sudah selesai. Paket sudah diambil customer.', time: '17:05', dateLabel: 'Kemarin' },
    ],
  },
  {
    id: 'chat-5',
    agenName: 'HAFSAH & BROTHERS',
    kodeLoket: 'SBPAYS-HFB-002',
    waNumber: '+62 819-1066-6926',
    avatarInitials: 'HB',
    area: 'Lombok - Mataram',
    kodeWilayah: 'LOM-HFB',
    bailoutStatus: 'Minus Rp -2.1jt',
    online: true,
    caseStatus: 'In Progress',
    unread: 0,
    lastPreview: 'CS, untuk case bailout 2.1jt saya sudah setor via ATM, bukti menyusul',
    lastTime: '06:50',
    messages: [
      { id: 'm1', sender: 'cs', text: 'Halo pak, paket EC3 SHPE123 belum dibagging, mohon dibantu ya pak.', time: '06:40', dateLabel: 'Hari ini' },
      { id: 'm2', sender: 'agent', text: 'CS, untuk case bailout 2.1jt saya sudah setor via ATM, bukti menyusul ya. Mohon cek mutasi BCA.', time: '06:50', dateLabel: 'Hari ini' },
    ],
  },
];

function caseBadge(status: CaseStatus) {
  if (status === 'Open') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'In Progress') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function caseIcon(status: CaseStatus) {
  if (status === 'Open') return <CircleDot className="h-3 w-3" />;
  if (status === 'In Progress') return <Timer className="h-3 w-3" />;
  return <XCircle className="h-3 w-3" />;
}

export default function ChatPage() {
  const [chats, setChats] = useState<ChatRoom[]>(MOCK_CHATS);
  const [selectedId, setSelectedId] = useState<string>('chat-1');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('Semua');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => chats.find((c) => c.id === selectedId) ?? chats[0], [chats, selectedId]);

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats.filter((c) => {
      if (q) {
        const hay = `${c.agenName} ${c.kodeLoket}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter !== 'Semua' && c.caseStatus !== filter) return false;
      return true;
    });
  }, [chats, search, filter]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [selected?.messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selected) return;
    setSending(true);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'cs',
      text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      dateLabel: 'Hari ini',
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, messages: [...c.messages, newMsg], lastPreview: text.slice(0, 48), lastTime: newMsg.time, unread: 0 }
          : c
      )
    );
    setDraft('');
    setTimeout(() => setSending(false), 400);
  };

  const handleQuickReply = (template: string) => {
    setDraft(template);
  };

  const toggleCaseStatus = (next: CaseStatus) => {
    setChats((prev) => prev.map((c) => (c.id === selectedId ? { ...c, caseStatus: next } : c)));
  };

  const clearUnread = (id: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="px-5 sm:px-6 py-4 flex items-start gap-4">
          <span className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-slate-900 flex items-center gap-2">
              CS Inbox <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold tracking-widest uppercase">LIVE CHAT</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">Kelola percakapan agen terkait Bagging, Bailout, dan kendala operasional resi secara terpusat.</p>
          </div>
        </div>
      </div>

      {/* 3-Kolom Responsif */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[68vh]">
        {/* Kolom Kiri - Inbox */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden min-h-[320px] lg:min-h-0">
          <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Agen / Kode Loket"
                className="w-full rounded-xl bg-white border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(['Semua', 'Open', 'In Progress', 'Resolved'] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    filter === s ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Tidak ada chat</div>
            ) : (
              filteredChats.map((chat) => {
                const active = chat.id === selectedId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedId(chat.id);
                      clearUnread(chat.id);
                    }}
                    className={`w-full text-left flex gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer ${active ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {chat.avatarInitials}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${chat.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{chat.agenName}</p>
                        {chat.unread > 0 && <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{chat.unread}</span>}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 truncate">{chat.kodeLoket}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastPreview}</p>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span className="text-[11px] text-slate-400 font-mono">{chat.lastTime}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${caseBadge(chat.caseStatus)}`}>
                        {caseIcon(chat.caseStatus)} {chat.caseStatus}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="p-2 border-t border-slate-200/80 bg-slate-50/30 text-[11px] text-slate-500 text-center shrink-0">
            {filteredChats.length} percakapan
          </div>
        </div>

        {/* Kolom Tengah - Chat Room */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden min-h-[420px] lg:min-h-0">
          {selected ? (
            <>
              {/* Header Room */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{selected.avatarInitials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                      {selected.agenName}
                      <span className={`h-2 w-2 rounded-full ${selected.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[11px] font-medium text-slate-500">{selected.online ? 'Online' : 'Offline'}</span>
                    </p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                      <span className="font-mono">{selected.kodeLoket}</span>
                      <span className="hidden sm:inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {selected.waNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-slate-50 border border-slate-200">
                    {(["Open", "In Progress", "Resolved"] as CaseStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleCaseStatus(s)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${selected.caseStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-transparent hover:bg-slate-100'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div ref={streamRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {selected.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'cs' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm border text-sm leading-relaxed whitespace-pre-wrap ${m.sender === 'cs' ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-sm' : 'bg-white text-slate-800 border-slate-200 rounded-bl-sm'}`}>
                      <p>{m.text}</p>
                      <div className={`flex items-center gap-1 mt-1 text-[11px] ${m.sender === 'cs' ? 'text-indigo-200 justify-end' : 'text-slate-400'}`}>
                        <Clock className="h-3 w-3" /> {m.time} {m.sender === 'cs' && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-slate-200/80 bg-white shrink-0">
                <div className="flex items-end gap-2 rounded-2xl bg-slate-50 border border-slate-200 p-2 focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                  <button
                    onClick={() => alert('Fitur lampiran coming soon')}
                    className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shrink-0 cursor-pointer"
                    aria-label="Lampiran"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Tulis balasan..."
                    className="flex-1 max-h-24 min-h-[36px] bg-transparent border-0 focus:outline-none text-sm text-slate-900 placeholder:text-slate-400 resize-none py-2"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" /> {sending ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Enter untuk kirim • Shift+Enter baris baru</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Pilih percakapan</div>
          )}
        </div>

        {/* Kolom Kanan - Info & Quick Reply */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-[280px] lg:min-h-0">
          {/* Ringkasan Agen */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden shrink-0">
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-600 uppercase">
              <User className="h-3.5 w-3.5" /> Ringkasan Agen
            </div>
            {selected ? (
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">{selected.avatarInitials}</div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{selected.agenName}</p>
                    <p className="text-xs font-mono text-slate-500">{selected.kodeLoket}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Wilayah/Area</p>
                      <p className="font-medium text-slate-800">{selected.area}</p>
                      <p className="font-mono text-[11px] text-slate-500">{selected.kodeWilayah}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <Wallet className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-widest text-amber-700 uppercase">Bailout/Minus Terakhir</p>
                      <p className="font-semibold text-amber-800">{selected.bailoutStatus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Nomor WA</p>
                      <p className="font-mono font-medium text-slate-800">{selected.waNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                    <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Status Case</p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-[11px] font-bold border ${caseBadge(selected.caseStatus)}`}>
                        {caseIcon(selected.caseStatus)} {selected.caseStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-400">Pilih chat</div>
            )}
          </div>

          {/* Quick Reply */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[200px]">
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-600 uppercase shrink-0">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Quick Reply
            </div>
            <div className="p-3 space-y-2 overflow-y-auto">
              <p className="text-[11px] text-slate-500 leading-relaxed">Template balasan cepat — klik untuk isi textarea.</p>
              <div className="grid gap-2">
                {QUICK_REPLIES.map((tpl) => (
                  <button
                    key={tpl}
                    onClick={() => handleQuickReply(tpl)}
                    className="text-left px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-xs font-medium text-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {tpl}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-slate-200/80 bg-slate-50/30 shrink-0">
              <p className="text-[11px] text-slate-400">Mengklik template langsung mengisi textarea balasan di tengah.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
