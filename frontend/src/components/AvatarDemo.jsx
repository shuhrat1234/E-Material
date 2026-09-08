import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { CloseIcon, SendIcon } from './Icons';

const GREETING_TEXT = "Assalomu alaykum! Men Olmazor tumani ichki ishlar bo'limi sun'iy intellekt yordamchisiman. Sizga qanday yordam bera olaman?";
const GREETING_VIDEO = '/officer-talking.mp4';
const GREETING_AUDIO = '/greeting-jasur.wav';
const IDLE_VIDEO = '/officer-idle.mp4';
const TALKING_VIDEO = '/officer-talking.mp4';

const SUGGESTIONS = [
  "Ariza topshirish tartibi qanday?",
  "Pasport yo'qolganda nima qilish kerak?",
  "Murojaatim holatini qanday tekshiraman?",
  "Tergovchi qabuliga qanday yozilsa bo'ladi?",
];

function AvatarDemo({ lang = 'uz', onBack }) {
  const [inCall, setInCall] = useState(false);
  const [query, setQuery] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const idleVideoRef = useRef(null);
  const talkingVideoRef = useRef(null);

  // Setup SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          sendQuery(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [lang]);

  const playSpeech = (audioUrl, onFinish) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const talkingVid = talkingVideoRef.current;
    const idleVid = idleVideoRef.current;

    audio.onplay = () => {
      setIsSpeaking(true);
      if (talkingVid) {
        talkingVid.currentTime = 0;
        talkingVid.play().catch(() => {});
      }
    };

    audio.onended = () => {
      setIsSpeaking(false);
      if (talkingVid) {
        talkingVid.pause();
        talkingVid.currentTime = 0;
      }
      if (idleVid) {
        idleVid.play().catch(() => {});
      }
      if (onFinish) onFinish();
    };

    audio.onerror = (err) => {
      console.warn('Audio playback error:', err);
      setIsSpeaking(false);
      if (talkingVid) talkingVid.pause();
    };

    audio.play().catch(e => {
      console.warn('Audio autoplay prevented:', e);
      setIsSpeaking(false);
      if (talkingVid) talkingVid.pause();
    });
  };

  const startCall = () => {
    setInCall(true);
    setError('');
    setLastQuestion('');
    setAnswerText(GREETING_TEXT);

    // Play greeting in Jasur's voice with talking video
    playSpeech(GREETING_AUDIO);
  };

  const endCall = () => {
    setInCall(false);
    setIsSpeaking(false);
    setIsListening(false);
    setLoading(false);
    if (talkingVideoRef.current) {
      talkingVideoRef.current.pause();
      talkingVideoRef.current.currentTime = 0;
    }
    if (idleVideoRef.current) {
      idleVideoRef.current.play().catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setError(lang === 'ru' ? 'Браузер не поддерживает распознавание речи' : "Brauzeringiz ovoz tanishni qo'llab-quvvatlamaydi. Matn yozing.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsSpeaking(false);
        if (talkingVideoRef.current) {
          talkingVideoRef.current.pause();
          talkingVideoRef.current.currentTime = 0;
        }
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Mic start failed:', e);
      }
    }
  };

  const sendQuery = async (textToSend) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    setLastQuestion(q);
    setQuery('');
    setLoading(true);
    setError('');

    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
      setVideoSrc(IDLE_VIDEO);
    }

    try {
      const res = await axios.post(`${API_BASE}/avatar/session/`, { query: q, lang });
      const text = res.data.answer_text || '';
      const audioUrl = res.data.audio_url;

      setAnswerText(text);

      if (audioUrl) {
        playSpeech(audioUrl);
      } else {
        // Fallback to tts endpoint
        const ttsRes = await axios.post(`${API_BASE}/ai/tts/`, { text, model: 'jasur' });
        if (ttsRes.data.audio_url) {
          playSpeech(ttsRes.data.audio_url);
        }
      }
    } catch (err) {
      console.error('Avatar session query error:', err);
      setError("Javob olishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuery();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Background Avatar Video: Natural portrait distance, sharp and uncropped */}
      <div className="absolute inset-0 z-0 bg-[#b8b3af] flex items-center justify-center overflow-hidden">
        {/* Seamless blurred background extension */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-110 opacity-70 pointer-events-none"
          style={{ backgroundImage: `url('/officer-poster.png')` }}
        />

        {/* Idle Video (Breathing, calm eyes) */}
        <video
          ref={idleVideoRef}
          src={IDLE_VIDEO}
          poster="/officer-poster.png"
          autoPlay
          loop
          muted
          playsInline
          className={`relative z-10 h-full w-auto max-w-none md:max-w-full object-contain object-center contrast-[1.04] brightness-[1.02] transition-opacity duration-150 drop-shadow-2xl ${
            isSpeaking ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Talking Video (Lip-synced with Jasur voice) */}
        <video
          ref={talkingVideoRef}
          src={TALKING_VIDEO}
          loop
          muted
          playsInline
          className={`absolute z-10 h-full w-auto max-w-none md:max-w-full object-contain object-center contrast-[1.04] brightness-[1.02] transition-opacity duration-150 drop-shadow-2xl ${
            isSpeaking ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Subtle bottom gradient behind controls only */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 pointer-events-none">
        <button
          type="button"
          onClick={() => { endCall(); onBack(); }}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/10 shadow-lg pointer-events-auto"
          title="Orqaga"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* TOP-RIGHT CORNER: Active Conversation Dialog */}
      {inCall && (
        <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-30 max-w-[340px] sm:max-w-[420px] w-full flex flex-col items-end gap-2.5 pointer-events-auto">
          {/* User Question */}
          {lastQuestion && (
            <div className="flex justify-end w-full animate-fadeIn">
              <div className="max-w-[85%] bg-blue-600/95 text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xl border border-blue-400/30 backdrop-blur-md">
                {lastQuestion}
              </div>
            </div>
          )}

          {/* AI Answer Box - In TOP RIGHT CORNER */}
          <div className="flex justify-end w-full animate-fadeIn">
            <div className="w-full bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl rounded-tr-xs p-3.5 sm:p-4 text-white shadow-2xl space-y-2 text-left">
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-400 tracking-wide uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Jasur (AI Tergovchi)
                </span>
                {isSpeaking && (
                  <span className="text-emerald-400 text-[10px] lowercase font-medium">● gapirmoqda</span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-1 text-white/70 text-xs sm:text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                  <span className="text-xs text-white/60 ml-1">
                    Jasur javob tayyorlamoqda...
                  </span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm leading-relaxed text-white/95 font-medium">
                  {answerText || GREETING_TEXT}
                </p>
              )}

              {error && (
                <p className="text-xs text-rose-400 pt-0.5">{error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT CORNER: Official IIB Badge (Enlarged to 100% cover D-ID logo watermark) */}
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl pointer-events-none select-none min-w-[240px] sm:min-w-[270px]">
        <img src="/emblem.png" alt="O'zbekiston Gerbi" className="w-10 h-10 object-contain drop-shadow shrink-0" />
        <div className="text-left">
          <div className="text-[12px] sm:text-[13px] font-bold text-white tracking-wider leading-tight">OLMAZOR TUMANI IIB</div>
          <div className="text-[10px] sm:text-[11px] text-blue-300 font-medium leading-tight">Ichki ishlar bo'limi</div>
          <div className="text-[9px] text-white/50 tracking-tight mt-0.5">Rasmiy AI xizmati</div>
        </div>
      </div>

      {/* Bottom Interactive Area */}
      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 pb-4 sm:pb-6 flex flex-col justify-end">
        {!inCall ? (
          /* Initial Screen - Minimal button only */
          <div className="text-center my-auto py-8">
            <button
              type="button"
              onClick={startCall}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-neutral-900 font-bold text-base shadow-2xl hover:bg-white/95 hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <span>Qo'ng'iroqni boshlash</span>
            </button>
          </div>
        ) : (
          /* Active Call Dialog - Suggestions & Controls at bottom */
          <div className="w-full space-y-2.5">

            {/* Suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendQuery(item)}
                  disabled={loading}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white text-[11px] font-medium transition-all"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-2 pt-1 w-full">
              {/* Mic toggle */}
              <button
                type="button"
                onClick={toggleMic}
                disabled={loading}
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-lg ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-400/40'
                    : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20'
                }`}
                title={isListening ? "Eshitishni to'xtatish" : "Mikrofonni yoqish"}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>

              {/* Text input */}
              <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex items-center gap-1.5 bg-white/15 backdrop-blur-xl border border-white/20 rounded-full px-4 py-1.5 shadow-lg">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isListening ? "Sizni eshityapman..." : "Savolingizni yozing yoki mikrofondan gapiring..."}
                  className="flex-1 min-w-0 bg-transparent text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white flex items-center justify-center shrink-0 transition-all"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </form>

              {/* End call */}
              <button
                type="button"
                onClick={endCall}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 transition-all shadow-lg border border-red-400/30 active:scale-95"
                title="Qo'ng'iroqni tugatish"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AvatarDemo;
