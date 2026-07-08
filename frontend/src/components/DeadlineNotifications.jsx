import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { BellIcon, AlarmIcon, CloseIcon } from './Icons';

const REMINDER_INTERVAL_MS = 2 * 60 * 60 * 1000; // re-alert every 2 hours

function DeadlineNotifications({ lang, user, onViewDetails }) {
  const [items, setItems] = useState([]); // [{ material, bucket: 'today'|'tomorrow' }]
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const wrapperRef = useRef(null);
  const lastAlertKey = `em_deadline_last_alert_${user.id}`;

  const buildMessage = (next) => {
    const todayCount = next.filter(i => i.bucket === 'today').length;
    const tomorrowCount = next.filter(i => i.bucket === 'tomorrow').length;
    const parts = [];
    if (todayCount > 0) parts.push(lang === 'ru' ? `сегодня истекает срок по ${todayCount} материалу(ам)` : `bugun ${todayCount} material muddati tugaydi`);
    if (tomorrowCount > 0) parts.push(lang === 'ru' ? `завтра истекает срок по ${tomorrowCount} материалу(ам)` : `ertaga ${tomorrowCount} material muddati tugaydi`);
    return parts.join(lang === 'ru' ? ' и ' : ' va ');
  };

  const fireAlert = (message, toastItems = []) => {
    // In-app banner (visible while the tab is open and focused)
    setToast({ message, items: toastItems });
    setTimeout(() => setToast(null), 12000);

    // OS-level notification, reaches the user even if this tab isn't focused/visible
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(lang === 'ru' ? 'E-Material: истекающие сроки' : 'E-Material: muddatlar tugamoqda', {
          body: message,
          tag: 'em-deadline-reminder',
          renotify: true,
        });
      } catch (err) {
        console.error('Failed to show browser notification', err);
      }
    }
  };

  const maybeAlert = (next) => {
    if (next.length === 0) return;

    const lastAlert = Number(localStorage.getItem(lastAlertKey) || 0);
    if (Date.now() - lastAlert < REMINDER_INTERVAL_MS) return;

    localStorage.setItem(lastAlertKey, String(Date.now()));
    fireAlert(buildMessage(next), next);
  };

  const handleTestNotification = () => {
    const message = items.length > 0
      ? buildMessage(items)
      : (lang === 'ru' ? 'это тестовое уведомление о сроках' : 'bu test uchun muddat bildirishnomasi');

    // Close the dropdown first — the toast renders in the same spot and would
    // otherwise be hidden underneath the still-open panel.
    setOpen(false);

    const send = () => fireAlert(message, items);

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(send).catch(send);
    } else {
      send();
    }
  };

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
        maybeAlert(next);
      })
      .catch(err => console.error('Failed to load deadline notifications', err));
  };

  // Ask for OS notification permission once, so reminders can reach the user off-tab
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchDeadlines();
    // Poll often enough that a due 2-hour reminder isn't missed by much
    const interval = setInterval(fetchDeadlines, 5 * 60 * 1000);
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
        <div className="absolute right-0 top-14 w-[46rem] bg-gov-surface border border-gov-border rounded-2xl shadow-2xl text-left z-50 animate-[fadeIn_0.2s]">
          <div className="flex items-start gap-5 p-8 pb-5">
            <span className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlarmIcon className="h-11 w-11 text-gov-warning" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gov-text uppercase tracking-wide">
                {lang === 'ru' ? 'Внимание' : 'Diqqat'}
              </p>
              <p className="text-base font-medium text-gov-text leading-relaxed mt-2">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all shrink-0"
              title={lang === 'ru' ? 'Закрыть' : 'Yopish'}
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>

          {toast.items.length > 0 && (
            <div className="border-t border-gov-border divide-y divide-gov-border max-h-80 overflow-y-auto">
              {toast.items.map(({ material, bucket }) => (
                <button
                  key={material.id}
                  onClick={() => { onViewDetails(material.id); setToast(null); }}
                  className="w-full text-left px-8 py-4 hover:bg-gov-light/40 transition-colors flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-gov-primary truncate">{material.id} — {material.citizen_name}</span>
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider shrink-0 ${bucket === 'today' ? 'text-gov-danger' : 'text-gov-warning'}`}>
                    {bucket === 'today'
                      ? (lang === 'ru' ? 'Сегодня' : 'Bugun')
                      : (lang === 'ru' ? 'Завтра' : 'Ertaga')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-gov-surface border border-gov-border rounded-lg shadow-lg text-left z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2.5 border-b border-gov-border flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">
              {lang === 'ru' ? 'Сроки исполнения' : 'Bajarish muddatlari'}
            </p>
            <button
              onClick={handleTestNotification}
              className="text-[9px] font-bold uppercase tracking-wider text-gov-primary hover:underline shrink-0"
              title={lang === 'ru' ? 'Отправить тестовое уведомление сейчас' : 'Test bildirishnomasini hozir yuborish'}
            >
              {lang === 'ru' ? 'Тест' : 'Test'}
            </button>
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
