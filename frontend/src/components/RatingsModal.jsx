import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import Modal from './Modal';
import { CloseIcon, ThumbUpIcon, ThumbDownIcon } from './Icons';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function RatingsModal({ lang, isLike, officerIds = [], officerNames = {}, onClose }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(officerIds.map(id => axios.get(`${API_BASE}/officers/${id}/ratings/`).then(res => res.data)))
      .then(results => {
        const merged = results.flat().filter(r => r.is_like === isLike);
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRatings(merged);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load ratings', err);
        setLoading(false);
      });
  }, [officerIds.join(','), isLike]);

  const title = isLike
    ? (lang === 'ru' ? 'Положительные отзывы' : 'Ijobiy baholar')
    : (lang === 'ru' ? 'Отрицательные отзывы' : 'Salbiy baholar');

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gov-border shrink-0">
        <h3 className="font-display font-bold text-gov-text flex items-center gap-2">
          {isLike ? <ThumbUpIcon className="h-4 w-4 text-gov-success" /> : <ThumbDownIcon className="h-4 w-4 text-gov-danger" />}
          {title}
          <span className="text-xs font-medium text-gov-muted">({ratings.length})</span>
        </h3>
        <button onClick={onClose} className="p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-y-auto">
        {loading ? (
          <div className="px-6 py-12 text-center text-gov-muted text-sm font-medium">
            {lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
          </div>
        ) : ratings.length === 0 ? (
          <div className="px-6 py-12 text-center text-gov-muted text-sm font-medium">
            {lang === 'ru' ? 'Отзывов нет' : 'Baholar yo\'q'}
          </div>
        ) : (
          <div className="divide-y divide-gov-border">
            {ratings.map(r => (
              <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gov-text">{r.citizen_name}</p>
                  {(lang === 'ru' ? r.reason_ru : r.reason_uz) && (
                    <p className="text-xs text-gov-muted mt-1">{lang === 'ru' ? r.reason_ru : r.reason_uz}</p>
                  )}
                  {officerNames[r.officer] && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gov-primary mt-1.5">{officerNames[r.officer]}</p>
                  )}
                </div>
                <span className="text-[11px] text-gov-muted whitespace-nowrap shrink-0">{formatDate(r.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default RatingsModal;
