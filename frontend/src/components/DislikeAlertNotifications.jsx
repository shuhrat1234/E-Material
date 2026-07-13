import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../App';
import { ThumbDownIcon, CloseIcon } from './Icons';

// Four-tone descending chime, synthesized on the fly (no external audio asset needed).
function playDislikeChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.7, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    };
    playTone(988, 0, 0.4);
    playTone(880, 0.38, 0.45);
    playTone(740, 0.8, 0.5);
    playTone(554, 1.25, 0.75);
    setTimeout(() => ctx.close(), 2200);
  } catch (err) {
    console.error('Failed to play alert chime', err);
  }
}

function DislikeAlertNotifications({ lang, user }) {
  const [toast, setToast] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const wsBase = API_BASE.replace(/^http/, 'ws').replace(/\/api$/, '') + `/ws/chat/?user_id=${encodeURIComponent(user.id)}`;
    const ws = new WebSocket(wsBase);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        return;
      }
      if (data.kind !== 'dislike_alert') return;

      const officerName = lang === 'ru' ? data.officer_name_ru : data.officer_name_uz;
      const reason = lang === 'ru' ? data.reason_ru : data.reason_uz;
      const message = lang === 'ru'
        ? `${data.citizen_name} поставил дизлайк сотруднику ${officerName}${reason ? `: ${reason}` : ''}`
        : `${data.citizen_name} ${officerName}ga dislayk qo'ydi${reason ? `: ${reason}` : ''}`;

      setToast(message);
      playDislikeChime();

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(lang === 'ru' ? 'E-Material: новый дизлайк' : 'E-Material: yangi dislayk', {
            body: message,
            tag: `em-dislike-${Date.now()}`,
          });
        } catch (err) {
          console.error('Failed to show browser notification', err);
        }
      }
    };

    return () => ws.close();
  }, [user.id, lang]);

  if (!toast) return null;

  return (
    <div
      className="fixed top-20 right-6 w-[40rem] max-w-[calc(100vw-3rem)] bg-gov-surface border border-gov-border rounded-2xl shadow-2xl p-7 text-left z-[200] flex items-start gap-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <span className="w-16 h-16 rounded-full bg-gov-dangerLight flex items-center justify-center shrink-0">
        <ThumbDownIcon className="h-9 w-9 text-gov-danger" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-gov-danger uppercase tracking-wide">
          {lang === 'ru' ? 'Новый дизлайк' : 'Yangi dislayk'}
        </p>
        <p className="text-base font-medium text-gov-text leading-relaxed mt-2">{toast}</p>
      </div>
      <button
        onClick={() => setToast(null)}
        className="p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all shrink-0"
      >
        <CloseIcon className="h-6 w-6" />
      </button>
    </div>
  );
}

export default DislikeAlertNotifications;
