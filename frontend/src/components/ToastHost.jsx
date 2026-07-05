import React, { useState, useEffect } from 'react';
import { registerToastHost } from '../toastService';
import { CheckIcon, CloseIcon, AlarmIcon } from './Icons';

const TONES = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckIcon className="h-4 w-4" /> },
  error: { bg: 'bg-rose-50', text: 'text-gov-danger', icon: <CloseIcon className="h-4 w-4" /> },
  info: { bg: 'bg-blue-50', text: 'text-gov-primary', icon: <AlarmIcon className="h-4 w-4" /> },
};

function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    registerToastHost((toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    });
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => {
        const tone = TONES[t.type] || TONES.info;
        return (
          <div
            key={t.id}
            className={`${tone.bg} rounded-xl shadow-pop p-3.5 flex items-start gap-2.5 text-left`}
            style={{ animation: 'modalIn 0.18s ease-out' }}
          >
            <span className={`shrink-0 mt-0.5 ${tone.text}`}>{tone.icon}</span>
            <p className={`text-xs font-medium leading-relaxed flex-1 ${tone.text}`}>{t.message}</p>
            <button onClick={() => dismiss(t.id)} className={`shrink-0 ${tone.text} opacity-60 hover:opacity-100`}>
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastHost;
