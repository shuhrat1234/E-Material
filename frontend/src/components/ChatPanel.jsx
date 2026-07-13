import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { UsersIcon, PaperclipIcon, SendIcon, ChatIcon, CheckIcon, DoubleCheckIcon, CopyIcon, TrashIcon } from './Icons';
import { confirm } from '../confirmService';
import Avatar from './ui/Avatar';
import { notify } from '../toastService';

function ChatPanel({ lang, user }) {
  const [officers, setOfficers] = useState([]);
  const [activeThread, setActiveThread] = useState(null); // null = group chat, officer id = personal
  const [messages, setMessages] = useState([]); // flat list of every message seen (group + all loaded threads)
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadBySender, setUnreadBySender] = useState({});
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const senderId = user?.id || 'unknown';
  const senderName = user?.name || (lang === 'ru' ? 'Сотрудник' : 'Xodim');

  // Kept in sync every render so the long-lived websocket handler always sees fresh values
  const latestRef = useRef({ activeThread, lang });
  latestRef.current = { activeThread, lang };

  const mergeMessages = (incoming) => {
    setMessages(prev => {
      const byId = new Map(prev.map(m => [m.id, m]));
      incoming.forEach(m => byId.set(m.id, m));
      return Array.from(byId.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
    });
  };

  // Load contacts (other officers) once
  useEffect(() => {
    axios.get(`${API_BASE}/officers/`)
      .then(res => setOfficers(res.data.filter(o => o.id !== senderId)))
      .catch(err => console.error('Failed to load officers', err));
  }, []);

  // Per-contact unread counts, refreshed periodically and nudged live via the websocket below
  const fetchUnreadBySender = () => {
    axios.get(`${API_BASE}/chat/messages/unread_count/`, { params: { user_id: senderId } })
      .then(res => setUnreadBySender(res.data.by_sender || {}))
      .catch(err => console.error('Failed to load unread counts', err));
  };

  useEffect(() => {
    fetchUnreadBySender();
    const interval = setInterval(fetchUnreadBySender, 15000);
    return () => clearInterval(interval);
  }, [senderId]);

  // Opening a DM thread marks it read server-side; clear its badge right away
  useEffect(() => {
    if (activeThread) {
      setUnreadBySender(prev => (prev[activeThread] ? { ...prev, [activeThread]: 0 } : prev));
    }
  }, [activeThread]);

  // Open a single websocket connection for the lifetime of this panel
  useEffect(() => {
    const wsBase = API_BASE.replace(/^http/, 'ws').replace(/\/api$/, '') + `/ws/chat/?user_id=${encodeURIComponent(senderId)}`;
    const ws = new WebSocket(wsBase);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.kind === 'read') {
        setMessages(prev => prev.map(m =>
          (m.sender_id === senderId && m.recipient_id === data.reader_id) ? { ...m, is_read: true } : m
        ));
        return;
      }

      if (data.kind === 'delete') {
        setMessages(prev => prev.filter(m => m.id !== data.id));
        return;
      }

      mergeMessages([data]);

      if (data.sender_id !== senderId) {
        const { activeThread: openThread, lang: currentLang } = latestRef.current;
        const threadKey = data.recipient_id ? data.sender_id : null;
        if (threadKey !== openThread) {
          const preview = data.text || (currentLang === 'ru' ? '📎 Файл' : '📎 Fayl');
          notify(`${data.sender_name}: ${preview}`, 'info');
        }
        if (data.recipient_id === senderId && threadKey !== openThread) {
          setUnreadBySender(prev => ({ ...prev, [data.sender_id]: (prev[data.sender_id] || 0) + 1 }));
        }
      }
    };

    return () => ws.close();
  }, []);

  // Load history whenever the active thread changes
  useEffect(() => {
    const params = activeThread
      ? { user_id: senderId, peer_id: activeThread }
      : {};
    axios.get(`${API_BASE}/chat/messages/`, { params })
      .then(res => mergeMessages(res.data))
      .catch(err => console.error('Failed to load chat history', err));
  }, [activeThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThread]);

  const threadMessages = messages.filter(m => {
    if (!activeThread) return !m.recipient_id;
    return (m.sender_id === senderId && m.recipient_id === activeThread) ||
           (m.sender_id === activeThread && m.recipient_id === senderId);
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    setSending(true);
    const form = new FormData();
    form.append('sender_id', senderId);
    form.append('sender_name', senderName);
    form.append('text', text.trim());
    if (activeThread) form.append('recipient_id', activeThread);
    if (file) form.append('file', file);

    axios.post(`${API_BASE}/chat/messages/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        setText('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSending(false);
      })
      .catch(err => {
        console.error('Failed to send message', err);
        setSending(false);
        notify(lang === 'ru' ? 'Ошибка отправки сообщения' : 'Xabar yuborishda xatolik', 'error');
      });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const activeOfficer = officers.find(o => o.id === activeThread);

  const handleCopy = (m) => {
    if (!m.text) return;
    navigator.clipboard.writeText(m.text)
      .then(() => notify(lang === 'ru' ? 'Скопировано' : 'Nusxalandi', 'success'))
      .catch(() => notify(lang === 'ru' ? 'Не удалось скопировать' : 'Nusxalab bo\'lmadi', 'error'));
  };

  const handleDelete = async (m) => {
    const ok = await confirm(
      lang === 'ru' ? 'Удалить сообщение у всех?' : 'Xabar barchada o\'chirilsinmi?'
    );
    if (!ok) return;
    axios.delete(`${API_BASE}/chat/messages/${m.id}/`)
      .catch(err => {
        console.error('Failed to delete message', err);
        notify(lang === 'ru' ? 'Не удалось удалить сообщение' : 'Xabarni o\'chirib bo\'lmadi', 'error');
      });
  };

  return (
    <div className="bg-gov-surface rounded-2xl shadow-card flex h-[700px] overflow-hidden">
      {/* Contacts sidebar */}
      <div className="w-64 border-r border-gov-border shrink-0 overflow-y-auto bg-gov-light/40 p-2">
        <button
          onClick={() => setActiveThread(null)}
          className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors mb-1 ${
            !activeThread ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-text hover:bg-gov-surface'
          }`}
        >
          <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!activeThread ? 'bg-gov-primary text-white' : 'bg-gov-surface text-gov-muted'}`}>
            <UsersIcon className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold">{lang === 'ru' ? 'Общий чат' : 'Umumiy chat'}</span>
        </button>

        <div className="px-3 py-2 text-[9px] font-bold text-gov-muted uppercase tracking-widest">
          {lang === 'ru' ? 'Личные сообщения' : 'Shaxsiy xabarlar'}
        </div>
        {officers.map(o => (
          <button
            key={o.id}
            onClick={() => setActiveThread(o.id)}
            className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeThread === o.id ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-text hover:bg-gov-surface'
            }`}
          >
            <Avatar src={o.avatar} initials={o.photo || o.name_ru?.[0]} size="w-9 h-9" />
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{lang === 'ru' ? o.name_ru : o.name_uz}</p>
              <p className="text-[10px] text-gov-muted truncate">{lang === 'ru' ? o.rank_ru : o.rank_uz}</p>
            </div>
            {!!unreadBySender[o.id] && (
              <span className="shrink-0 min-w-[1.25rem] h-5 px-1 rounded-full bg-gov-primary text-white text-[10px] font-bold inline-flex items-center justify-center">
                {unreadBySender[o.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-gov-border px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-gov-primaryLight text-gov-primary flex items-center justify-center shrink-0">
              <ChatIcon className="h-4 w-4" />
            </span>
            <h3 className="font-semibold text-sm text-gov-text">
              {activeThread
                ? (lang === 'ru' ? activeOfficer?.name_ru : activeOfficer?.name_uz) || activeThread
                : (lang === 'ru' ? 'Общий чат отделения' : 'Bo\'lim umumiy chati')}
            </h3>
          </div>
          <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full ${connected ? 'text-emerald-600 bg-emerald-50' : 'text-gov-danger bg-rose-50'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gov-danger'}`} />
            {connected ? (lang === 'ru' ? 'В сети' : 'Onlayn') : (lang === 'ru' ? 'Нет связи' : 'Aloqa yo\'q')}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gov-light/30">
          {threadMessages.length === 0 && (
            <div className="text-center py-12 text-gov-muted text-xs font-medium">
              {lang === 'ru' ? 'Сообщений пока нет' : 'Hozircha xabarlar yo\'q'}
            </div>
          )}
          {threadMessages.map(m => {
            const isMine = m.sender_id === senderId;
            return (
              <div key={m.id} className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 text-left shadow-sm ${
                  isMine ? 'bg-gov-primary text-white rounded-br-md' : 'bg-gov-surface text-gov-text rounded-bl-md'
                }`}>
                  {m.text && (
                    <button
                      type="button"
                      onClick={() => handleCopy(m)}
                      title={lang === 'ru' ? 'Копировать' : 'Nusxalash'}
                      className={`absolute -top-2.5 ${isMine ? 'left-6' : '-right-2.5'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full shadow-sm bg-gov-surface border border-gov-border text-gov-muted hover:text-gov-primary`}
                    >
                      <CopyIcon className="h-3 w-3" />
                    </button>
                  )}
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => handleDelete(m)}
                      title={lang === 'ru' ? 'Удалить у всех' : 'Barchada o\'chirish'}
                      className="absolute -top-2.5 -left-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full shadow-sm bg-gov-surface border border-gov-border text-gov-muted hover:text-gov-danger"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  )}
                  {!isMine && (
                    <p className="text-[10px] font-bold text-gov-primary mb-0.5">{m.sender_name}</p>
                  )}
                  {m.text && <p className="text-xs whitespace-pre-line leading-relaxed">{m.text}</p>}
                  {m.file_url && (
                    m.is_image ? (
                      <a href={m.file_url} target="_blank" rel="noreferrer">
                        <img src={m.file_url} alt="attachment" className="mt-2 max-h-56 rounded-lg object-contain" />
                      </a>
                    ) : (
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 flex items-center gap-2 text-[11px] font-semibold underline ${isMine ? 'text-white' : 'text-gov-primary'}`}
                      >
                        <PaperclipIcon className="h-3.5 w-3.5" /> {lang === 'ru' ? 'Открыть файл' : 'Faylni ochish'}
                      </a>
                    )
                  )}
                  <div className={`flex items-center justify-end gap-1 mt-1.5 ${isMine ? 'text-white/70' : 'text-gov-muted'}`}>
                    <p className="text-[9px] font-mono">{formatTime(m.time)}</p>
                    {isMine && activeThread && (
                      m.is_read
                        ? <DoubleCheckIcon className="h-3 w-3 text-sky-300" />
                        : <CheckIcon className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-gov-border p-3 flex flex-col gap-2 shrink-0">
          {file && (
            <div className="flex items-center justify-between bg-gov-light rounded-xl px-3 py-1.5 text-[11px] text-gov-text">
              <span className="truncate">{file.name}</span>
              <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-gov-danger font-bold px-2">×</button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full text-gov-muted hover:text-gov-primary hover:bg-gov-primaryLight transition-colors shrink-0 inline-flex"
              title={lang === 'ru' ? 'Прикрепить файл' : 'Fayl biriktirish'}
            >
              <PaperclipIcon className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={lang === 'ru' ? 'Написать сообщение...' : 'Xabar yozish...'}
              className="flex-1 px-4 py-2.5 rounded-full bg-gov-light text-xs focus:outline-none focus:ring-2 focus:ring-gov-primary/30"
            />
            <button
              type="submit"
              disabled={sending || (!text.trim() && !file)}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="w-10 h-10 rounded-full hover:opacity-90 disabled:opacity-40 shrink-0 flex items-center justify-center transition-opacity"
              title={lang === 'ru' ? 'Отправить' : 'Yuborish'}
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
