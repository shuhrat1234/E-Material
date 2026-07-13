import React from 'react';
import CitizenAiChat from './CitizenAiChat';

function AiKioskView({ lang }) {
  return (
    <div className="w-full h-[calc(100vh-9.5rem)] flex flex-col">
      <div className="text-center mb-2 shrink-0">
        <h2 className="font-display font-bold text-xl text-gov-primary uppercase tracking-wide">
          {lang === 'ru' ? 'AI-помощник' : 'AI-yordamchi'}
        </h2>
        <p className="text-xs text-gov-muted font-medium mt-1">
          {lang === 'ru'
            ? 'Задайте вопрос — подскажем, что делать дальше'
            : 'Savol bering — nima qilish kerakligini aytamiz'}
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <CitizenAiChat lang={lang} fullPage />
      </div>
    </div>
  );
}

export default AiKioskView;
