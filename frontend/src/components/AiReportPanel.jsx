import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { SendIcon, SparkleIcon } from './Icons';

function AiReportPanel({ lang }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const examples = lang === 'ru'
    ? [
        'Сколько дел у Каримова Санжара за август?',
        'Сравни всех следователей за этот месяц',
        'Сколько материалов с истёкшим сроком в этом месяце?',
      ]
    : [
        "Karimov Sanjar avgust oyida nechta ish ko'rdi?",
        "Shu oyda barcha sledovatellarni solishtir",
        "Shu oyda muddati buzilgan materiallar nechta?",
      ];

  const send = (text) => {
    const query = (text ?? input).trim();
    if (!query || sending) return;

    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInput('');
    setSending(true);

    axios.post(`${API_BASE}/ai/report/`, { query, lang })
      .then(res => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: res.data.answer,
          rows: res.data.rows || [],
        }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: lang === 'ru'
            ? 'Не удалось получить ответ. Проверьте подключение к интернету.'
            : "Javob olib bo'lmadi. Internet aloqasini tekshiring.",
        }]);
      })
      .finally(() => setSending(false));
  };

  return (
    <div className="bg-gov-surface rounded-2xl shadow-card w-full flex flex-col h-[calc(100vh-8rem)] max-h-[42rem]">
      <div className="border-b border-gov-border flex items-center gap-2.5 shrink-0 px-6 py-4">
        <span className="rounded-full bg-gov-primaryLight flex items-center justify-center text-gov-primary shrink-0 w-9 h-9">
          <SparkleIcon className="h-5 w-5" />
        </span>
        <div className="text-left min-w-0">
          <h3 className="font-display font-semibold text-gov-text text-sm">
            Aqlli hisobot
          </h3>
          <p className="text-gov-muted text-[11px]">
            {lang === 'ru'
              ? 'Задайте вопрос о статистике сотрудников — AI посчитает по реальным данным'
              : "Xodimlar statistikasi bo'yicha savol bering — AI haqiqiy ma'lumotlar bo'yicha hisoblaydi"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 px-6 py-4">
        {messages.length === 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-center text-gov-muted text-xs mb-3">
              {lang === 'ru' ? 'Например:' : 'Masalan:'}
            </p>
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => send(ex)}
                className="block w-full text-left px-4 py-2.5 text-xs rounded-xl border border-gov-border bg-gov-light/50 hover:bg-gov-primaryLight hover:border-gov-primary/30 text-gov-text transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl leading-relaxed px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-gov-primary text-white rounded-br-md'
                : 'bg-gov-light text-gov-text rounded-bl-md'
            }`}>
              <p>{m.text}</p>
              {m.rows && m.rows.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-gov-border/60 space-y-1">
                  {m.rows.map((r, ri) => (
                    <div key={ri} className="flex items-center justify-between text-xs">
                      <span className="text-gov-muted">{r.label}</span>
                      <span className="font-bold text-gov-text">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gov-light text-gov-muted rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">
              {lang === 'ru' ? 'Считаю...' : 'Hisoblayapman...'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gov-border flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={lang === 'ru' ? 'Введите вопрос...' : 'Savolingizni kiriting...'}
          className="flex-1 min-w-0 rounded-full bg-gov-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || sending}
          className="shrink-0 rounded-full bg-gov-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90 w-10 h-10"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default AiReportPanel;
