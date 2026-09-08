import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { CloseIcon, SendIcon } from './Icons';

const GREETING_TEXT = "Assalomu alaykum! Men Olmazor tumani ichki ishlar bo'limi sun'iy intellekt yordamchisiman. Sizga qanday yordam bera olaman?";

const SUGGESTIONS = [
  "Ariza topshirish tartibi qanday?",
  "Pasport yo'qolganda nima qilish kerak?",
  "Murojaatim holatini qanday tekshiraman?",
  "Tergovchi qabuliga qanday yozilsa bo'ladi?",
];

function AvatarDemo({ lang = 'uz', onBack }) {
  const [inCall, setInCall] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [query, setQuery] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const streamInfoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

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
      cleanupStream();
    };
  }, [lang]);

  const cleanupStream = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (streamInfoRef.current) {
      const { id, session_id } = streamInfoRef.current;
      axios.post(`${API_BASE}/avatar/stream-close/`, { stream_id: id, session_id }).catch(() => {});
      streamInfoRef.current = null;
    }
  };

  const startCall = async () => {
    setInCall(true);
    setLoading(true);
    setError('');
    setAnswerText(GREETING_TEXT);
    setLastQuestion('');

    try {
      // 1. Create WebRTC stream on D-ID
      const startRes = await axios.post(`${API_BASE}/avatar/stream-start/`);
      const stream = startRes.data;
      streamInfoRef.current = stream;

      // 2. Setup RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: stream.ice_servers || [{ urls: ['stun:stun.l.google.com:19302'] }]
      });
      peerConnectionRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStreamReady(true);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && streamInfoRef.current) {
          axios.post(`${API_BASE}/avatar/stream-ice/`, {
            stream_id: streamInfoRef.current.id,
            session_id: streamInfoRef.current.session_id,
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          }).catch(() => {});
        }
      };

      // 3. Set remote offer & send local answer
      await pc.setRemoteDescription(new RTCSessionDescription(stream.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await axios.post(`${API_BASE}/avatar/stream-sdp/`, {
        stream_id: stream.id,
        session_id: stream.session_id,
        answer: answer,
      });

      // 4. Initial greeting with UzbekVoice Jasur voice + D-ID lip sync
      setTimeout(() => {
        sendGreeting(stream.id, stream.session_id);
      }, 800);

    } catch (err) {
      console.error('Failed to start avatar stream:', err);
      setError("Aloqa o'rnatishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      setLoading(false);
    }
  };

  const sendGreeting = async (streamId, sessionId) => {
    try {
      setIsSpeaking(true);
      await axios.post(`${API_BASE}/avatar/stream-talk/`, {
        stream_id: streamId,
        session_id: sessionId,
        text: GREETING_TEXT,
      });
    } catch (err) {
      console.warn('Greeting talk error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSpeaking(false), 5000);
    }
  };

  const endCall = () => {
    cleanupStream();
    setInCall(false);
    setStreamReady(false);
    setIsSpeaking(false);
    setIsListening(false);
    setLoading(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Mic start failed:', e);
      }
    }
  };

  const sendQuery = async (textToSend) => {
    const q = (textToSend || query).trim();
    if (!q || loading || !streamInfoRef.current) return;

    setLastQuestion(q);
    setQuery('');
    setLoading(true);
    setError('');

    try {
      setIsSpeaking(true);
      const res = await axios.post(`${API_BASE}/avatar/stream-talk/`, {
        stream_id: streamInfoRef.current.id,
        session_id: streamInfoRef.current.session_id,
        query: q,
      });
      setAnswerText(res.data.answer_text || '');
    } catch (err) {
      console.error('Stream talk query error:', err);
      setError(err.response?.data?.error || "Javob olishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
      setTimeout(() => setIsSpeaking(false), 6000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuery();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Background Avatar Video: WebRTC stream when inCall, Idle loop when idle */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        <video
          ref={videoRef}
          src={!inCall ? "/officer-idle.mp4" : undefined}
          poster="/officer-poster.png"
          autoPlay
          loop={!inCall}
          muted={!inCall}
          playsInline
          className={`w-full h-full object-cover object-top transition-transform duration-700 ${
            isSpeaking ? 'scale-[1.02] brightness-105' : 'scale-100 brightness-100'
          }`}
        />
        {/* Subtle speaking pulse glow */}
        {isSpeaking && (
          <div className="absolute inset-0 ring-4 ring-inset ring-blue-500/25 pointer-events-none animate-pulse transition-opacity" />
        )}
        {/* Soft contrast gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/60 pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6">
        <button
          type="button"
          onClick={() => { endCall(); onBack(); }}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/10"
          title="Orqaga"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {/* Live Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-lg">
          <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-blue-400 animate-ping' : streamReady ? 'bg-emerald-400' : inCall ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span>
            {isSpeaking
              ? 'Jasur gapirmoqda (UzbekVoice.ai)'
              : streamReady
              ? 'Jonli aloqada (D-ID + UzbekVoice)'
              : inCall
              ? 'Ulanmoqda...'
              : 'AI Tergovchi • Olmazor IIB'}
          </span>
        </div>

        <div className="w-10" />
      </div>

      {/* Center Waveform when speaking */}
      {isSpeaking && (
        <div className="relative z-20 flex items-center justify-center gap-1.5 my-auto pointer-events-none">
          <div className="w-1.5 h-8 bg-blue-400/90 rounded-full animate-pulse [animation-duration:600ms]" />
          <div className="w-1.5 h-14 bg-blue-300/90 rounded-full animate-pulse [animation-duration:400ms]" />
          <div className="w-1.5 h-20 bg-white rounded-full animate-pulse [animation-duration:500ms]" />
          <div className="w-1.5 h-14 bg-blue-300/90 rounded-full animate-pulse [animation-duration:450ms]" />
          <div className="w-1.5 h-8 bg-blue-400/90 rounded-full animate-pulse [animation-duration:650ms]" />
        </div>
      )}

      {/* Bottom Interactive Area */}
      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 pb-6 sm:pb-8 flex flex-col items-center">
        {!inCall ? (
          /* Initial Screen */
          <div className="text-center space-y-4">
            <div className="space-y-1 drop-shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Tergovchi (Jonli Lab Harakati)
              </h2>
              <p className="text-xs sm:text-sm text-white/85 font-medium">
                Ovoz: Jasur (UzbekVoice.ai) • Real-vaqtda Lip-sync
              </p>
            </div>

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
          /* Active Call Dialog */
          <div className="w-full space-y-3">
            {/* User Question */}
            {lastQuestion && (
              <div className="ml-auto max-w-[85%] w-fit bg-blue-600/90 text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-br-sm backdrop-blur-md shadow-lg border border-blue-400/30">
                {lastQuestion}
              </div>
            )}

            {/* Answer / Captions Box */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-white shadow-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-400 tracking-wide uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Jasur (AI Tergovchi)
                </span>
                {isSpeaking && (
                  <span className="text-emerald-400 text-[10px]">● Gapirmoqda</span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-2 text-white/70 text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <span className="text-xs text-white/60 ml-2">
                    Jasur ovoz tayyorlamoqda...
                  </span>
                </div>
              ) : (
                <p className="text-sm sm:text-base leading-relaxed text-white/95 font-medium">
                  {answerText || GREETING_TEXT}
                </p>
              )}

              {error && (
                <p className="text-xs text-rose-400 pt-1">{error}</p>
              )}
            </div>

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
