import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { BellIcon, AlarmIcon } from './Icons';

function DeadlineNotifications({ lang, user, onViewDetails }) {
  const [items, setItems] = useState([]); // [{ material, bucket: 'today'|'tomorrow' }]
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const seenToast = useRef(false);
  const wrapperRef = useRef(null);

  const fetchDeadlines = () => {
    axios.get(`${API_BASE}/materials/`)
      .then(res => {
        const mine = user.role === 'investigator'
          ? res.data.filter(m => m.officer === user.id)
          : res.data;

        const now = new Date();
        const dStr = (offset) => {
          const d = new Date(now);
          d.setDate(d.getDate() + offset);
          return d.toISOString().substring(0, 10);
        };

        const next = [];
        mine.forEach(m => {
          if (m.status === 'закрыт_в_срок') return;
          const dl = new Date(m.deadline).toISOString().substring(0, 10);
          if (dl === dStr(0)) next.push({ material: m, bucket: 'today' });
          else if (dl === dStr(1)) next.push({ material: m, bucket: 'tomorrow' });
        });

        setItems(next);

        if (!seenToast.current && next.length > 0) {
          seenToast.current = true;
          const todayCount = next.filter(i => i.bucket === 'today').length;
          const tomorrowCount = next.filter(i => i.bucket === 'tomorrow').length;
          const parts = [];
          if (todayCount > 0) parts.push(lang === 'ru' ? `сегодня истекает срок по ${todayCount} материалу(ам)` : `bugun ${todayCount} material muddati tugaydi`);
          if (tomorrowCount > 0) parts.push(lang === 'ru' ? `завтра истекает срок по ${tomorrowCount} материалу(ам)` : `ertaga ${tomorrowCount} material muddati tugaydi`);
          setToast(parts.join(lang === 'ru' ? ' и ' : ' va '));
          setTimeout(() => setToast(null), 8000);
        }
      })
      .catch(err => console.error('Failed to load deadline notifications', err));
  };

  useEffect(() => {
    fetchDeadlines();
    const interval = setInterval(fetchDeadlines, 60000);
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayItems = items.filter(i => i.bucket === 'today');
  const tomorrowItems = items.filter(i => i.bucket === 'tomorrow');

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all"
        title={lang === 'ru' ? 'Уведомления о сроках' : 'Muddat bildirishnomalari'}
      >
        <BellIcon className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-gov-danger text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {toast && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gov-border rounded-lg shadow-lg p-4 text-left z-50 flex items-start gap-2 animate-[fadeIn_0.2s]">
          <AlarmIcon className="h-4 w-4 text-gov-warning shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-gov-text leading-relaxed">
            {lang === 'ru' ? 'Внимание' : 'Diqqat'}: {toast}
          </p>
        </div>
      )}

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gov-border rounded-lg shadow-lg text-left z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2.5 border-b border-gov-border">
            <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">
              {lang === 'ru' ? 'Сроки исполнения' : 'Bajarish muddatlari'}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-gov-muted text-xs font-medium">
              {lang === 'ru' ? 'Нет срочных материалов' : 'Shoshilinch materiallar yo\'q'}
            </div>
          ) : (
            <div className="divide-y divide-gov-border">
              {todayItems.map(({ material }) => (
                <button
                  key={material.id}
                  onClick={() => { onViewDetails(material.id); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-gov-light/40 transition-colors flex flex-col gap-0.5"
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gov-danger">
                    {lang === 'ru' ? 'Истекает сегодня' : 'Bugun tugaydi'}
                  </span>
                  <span className="text-xs font-semibold text-gov-text">{material.id} — {material.citizen_name}</span>
                </button>
              ))}
              {tomorrowItems.map(({ material }) => (
                <button
                  key={material.id}
                  onClick={() => { onViewDetails(material.id); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-gov-light/40 transition-colors flex flex-col gap-0.5"
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gov-warning">
                    {lang === 'ru' ? 'Истекает завтра' : 'Ertaga tugaydi'}
                  </span>
                  <span className="text-xs font-semibold text-gov-text">{material.id} — {material.citizen_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DeadlineNotifications;
