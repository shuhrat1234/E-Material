import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { SendIcon, MicIcon, SpeakerIcon, ChatBubbleIcon } from './Icons';

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;
const speechSupported = !!SpeechRecognitionAPI;
const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function CitizenAiChat({ lang, fullPage = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const speak = (text) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
    window.speechSynthesis.speak(utterance);
  };

  const send = (text) => {
    const query = (text ?? input).trim();
    if (!query || sending) return;

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInput('');
    setSending(true);

    axios.post(`${API_BASE}/ai/citizen-chat/`, { query, lang, history })
      .then(res => {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
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

  const toggleListening = () => {
    if (!speechSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      send(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className={fullPage
      ? 'bg-gov-surface rounded-2xl shadow-card w-full flex flex-col h-full'
      : 'bg-gov-surface rounded-2xl shadow-card max-w-2xl mx-auto mt-8 flex flex-col h-[32rem]'
    }>
      <div className={`border-b border-gov-border flex items-center gap-2.5 shrink-0 ${fullPage ? 'px-6 py-3' : 'px-6 py-4'}`}>
        <span className={`rounded-full bg-gov-primaryLight flex items-center justify-center text-gov-primary shrink-0 ${fullPage ? 'w-11 h-11' : 'w-9 h-9'}`}>
          <ChatBubbleIcon className={fullPage ? 'h-6 w-6' : 'h-5 w-5'} />
        </span>
        <div className="text-left min-w-0">
          <h3 className={`font-display font-semibold text-gov-text ${fullPage ? 'text-lg' : 'text-sm'}`}>
            {lang === 'ru' ? 'Задайте вопрос' : 'Savol bering'}
          </h3>
          <p className={`text-gov-muted ${fullPage ? 'text-sm' : 'text-[11px]'}`}>
            {lang === 'ru' ? 'AI-помощник подскажет, что делать' : 'AI-yordamchi nima qilishni maslahat beradi'}
          </p>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto space-y-3 ${fullPage ? 'px-6 py-3' : 'px-6 py-4'}`}>
        {messages.length === 0 && (
          <p className={`text-center text-gov-muted ${fullPage ? 'text-lg mt-4' : 'text-xs mt-8'}`}>
            {lang === 'ru'
              ? 'Например: «У меня украли телефон, что делать?»'
              : 'Masalan: «Telefonim o\'g\'irlandi, nima qilishim kerak?»'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl leading-relaxed ${fullPage ? 'px-5 py-3.5 text-xl' : 'px-4 py-2.5 text-sm'} ${
              m.role === 'user'
                ? 'bg-gov-primary text-white rounded-br-md'
                : 'bg-gov-light text-gov-text rounded-bl-md flex items-start gap-2'
            }`}>
              <span className="flex-1">{m.text}</span>
              {m.role === 'assistant' && ttsSupported && (
                <button
                  onClick={() => speak(m.text)}
                  className="shrink-0 text-gov-muted hover:text-gov-primary transition-colors mt-0.5"
                  title={lang === 'ru' ? 'Прослушать' : 'Tinglash'}
                >
                  <SpeakerIcon className={fullPage ? 'h-5 w-5' : 'h-4 w-4'} />
                </button>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className={`bg-gov-light text-gov-muted rounded-2xl rounded-bl-md ${fullPage ? 'px-5 py-3.5 text-xl' : 'px-4 py-2.5 text-sm'}`}>
              {lang === 'ru' ? 'Печатает...' : 'Yozmoqda...'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gov-border flex items-center gap-2 shrink-0">
        {speechSupported && (
          <button
            onClick={toggleListening}
            className={`shrink-0 rounded-full flex items-center justify-center transition-colors ${fullPage ? 'w-14 h-14' : 'w-10 h-10'} ${
              listening ? 'bg-gov-danger text-white animate-pulse' : 'bg-gov-light text-gov-muted hover:text-gov-primary'
            }`}
            title={lang === 'ru' ? 'Голосовой ввод' : 'Ovozli kiritish'}
          >
            <MicIcon className={fullPage ? 'h-6 w-6' : 'h-4 w-4'} />
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={lang === 'ru' ? 'Введите вопрос...' : 'Savolingizni kiriting...'}
          className={`flex-1 rounded-full bg-gov-light focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${fullPage ? 'px-6 py-4 text-xl' : 'px-4 py-2.5 text-sm'}`}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || sending}
          className={`shrink-0 rounded-full bg-gov-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90 ${fullPage ? 'w-14 h-14' : 'w-10 h-10'}`}
        >
          <SendIcon className={fullPage ? 'h-6 w-6' : 'h-4 w-4'} />
        </button>
      </div>
    </div>
  );
}

export default CitizenAiChat;
