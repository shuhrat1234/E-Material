import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { SendIcon, SparkleIcon } from './Icons';

// Standalone demo page: DeepSeek answer -> Silero TTS (Uzbek) -> Simli
// lip-synced video, rendered fully server-side. Kept separate from the
// existing text chat (CitizenAiChat) so both can be compared side by side.
function AvatarDemo({ lang, onBack }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [answerText, setAnswerText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError('');
    setVideoUrl('');
    setAnswerText('');

    axios.post(`${API_BASE}/avatar/session/`, { query: query.trim(), lang })
      .then(res => {
        setAnswerText(res.data.answer_text || '');
        if (res.data.video_url) {
          setVideoUrl(res.data.video_url);
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

  return (
    <div className="w-full min-h-screen flex flex-col items-center py-10 px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center flex flex-col items-center gap-2">
          <span className="rounded-full bg-gov-primaryLight flex items-center justify-center text-gov-primary w-10 h-10">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <h2 className="font-display font-bold text-xl text-gov-primary uppercase tracking-wide">
            AI Avatar Demo
          </h2>
          <p className="text-xs text-gov-muted font-medium">
            {lang === 'ru'
              ? 'DeepSeek + Silero TTS (узбекский) + Simli — говорящий аватар'
              : "DeepSeek + Silero TTS (o'zbekcha) + Simli — gapiruvchi avatar"}
          </p>
        </div>

        <div className="bg-black rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative">
          {videoUrl ? (
            <video src={videoUrl} autoPlay controls className="w-full h-full object-contain" />
          ) : loading ? (
            <div className="text-white text-sm flex flex-col items-center gap-3 px-6 text-center">
              <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {lang === 'ru' ? 'Готовлю ответ...' : 'Javob tayyorlanmoqda...'}
              <span className="text-white/50 text-[11px]">
                {lang === 'ru' ? 'DeepSeek → озвучка → рендер видео (~10-30 сек)' : 'DeepSeek → ovoz → video render (~10-30 son)'}
              </span>
            </div>
          ) : (
            <div className="text-white/40 text-sm">
              {lang === 'ru' ? 'Задайте вопрос ниже' : 'Pastda savol bering'}
            </div>
          )}
        </div>

        {answerText && (
          <p className="text-sm text-gov-text bg-gov-light rounded-xl px-4 py-3">{answerText}</p>
        )}
        {error && (
          <p className="text-sm text-gov-danger bg-rose-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Введите вопрос...' : 'Savolingizni kiriting...'}
            className="flex-1 min-w-0 rounded-full bg-gov-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="shrink-0 rounded-full bg-gov-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90 w-10 h-10"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-xs font-semibold text-gov-muted hover:text-gov-primary transition-colors"
        >
          {lang === 'ru' ? '← Назад' : '← Orqaga'}
        </button>
      </div>
    </div>
  );
}

export default AvatarDemo;
