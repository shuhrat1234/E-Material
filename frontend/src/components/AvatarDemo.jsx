import React, { useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { SendIcon, CloseIcon } from './Icons';

const IDLE_SRC = '/avatar-idle.mp4';

// Standalone kiosk-style demo page: DeepSeek answer -> Silero TTS (Uzbek) ->
// Simli lip-synced video, rendered fully server-side. Kept separate from the
// existing text chat (CitizenAiChat) so both can be compared side by side.
// The avatar loops a short idle clip by default (so the face is always
// alive, not a frozen photo) and switches to the real answer clip once one
// comes back, then returns to idle when it finishes playing.
function AvatarDemo({ lang, onBack }) {
  const [query, setQuery] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [videoSrc, setVideoSrc] = useState(IDLE_SRC);
  const [isIdle, setIsIdle] = useState(true);
  const [idleFailed, setIdleFailed] = useState(false);
  const videoRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setLastQuestion(q);
    setQuery('');
    setLoading(true);
    setError('');
    setAnswerText('');

    axios.post(`${API_BASE}/avatar/session/`, { query: q, lang })
      .then(res => {
        setAnswerText(res.data.answer_text || '');
        if (res.data.video_url) {
          setIsIdle(false);
          setVideoSrc(res.data.video_url);
        } else {
          setError(res.data.error || (lang === 'ru' ? 'Видео не получено.' : 'Video olinmadi.'));
        }
      })
      .catch(err => {
        console.error('Avatar session failed:', err);
        setError(
          err.response?.data?.error ||
          (lang === 'ru' ? 'Не удалось создать аватар-сеанс.' : "Avatar seansini yaratib bo'lmadi.")
        );
      })
      .finally(() => setLoading(false));
  };

  const backToIdle = () => {
    setIsIdle(true);
    setVideoSrc(IDLE_SRC);
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900">
        {!idleFailed ? (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            autoPlay
            muted={isIdle}
            loop={isIdle}
            playsInline
            onEnded={!isIdle ? backToIdle : undefined}
            onError={() => { if (isIdle) setIdleFailed(true); }}
            poster="/avatar-poster.jpg"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/avatar-poster.jpg)' }}
          />
        )}

        {/* Legibility gradient for the text overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/50 pointer-events-none" />

        <button
          type="button"
          onClick={onBack}
          className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          title={lang === 'ru' ? 'Назад' : 'Orqaga'}
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="absolute top-0 inset-x-0 pt-4 pb-2 text-center">
          <h2 className="text-white font-display font-bold text-sm uppercase tracking-widest drop-shadow">
            AI Avatar
          </h2>
          <p className="text-white/60 text-[10px] mt-0.5">
            {lang === 'ru' ? 'DeepSeek + Silero + Simli' : 'DeepSeek + Silero + Simli'}
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 z-10 px-3 pb-3 space-y-1.5">
          {lastQuestion && (
            <div className="ml-auto max-w-[85%] w-fit bg-gov-primary/90 text-white text-xs leading-relaxed rounded-2xl rounded-br-md px-3.5 py-2 shadow">
              {lastQuestion}
            </div>
          )}
          {loading && (
            <div className="w-fit bg-black/55 backdrop-blur-sm text-white/85 text-xs rounded-2xl rounded-bl-md px-3.5 py-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" />
            </div>
          )}
          {answerText && !loading && (
            <div className="max-w-[92%] bg-black/55 backdrop-blur-sm text-white text-xs leading-relaxed rounded-2xl rounded-bl-md px-3.5 py-2 shadow">
              {answerText}
            </div>
          )}
          {error && (
            <div className="bg-rose-600/85 backdrop-blur-sm text-white text-xs rounded-2xl px-3.5 py-2 shadow">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Введите вопрос...' : 'Savolingizni kiriting...'}
              className="flex-1 min-w-0 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="shrink-0 rounded-full bg-gov-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90 w-9 h-9"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AvatarDemo;
