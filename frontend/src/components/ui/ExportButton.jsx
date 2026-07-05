import React from 'react';

function ExportButton({ onClick, lang, label, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-gov-muted hover:text-gov-primary hover:bg-gov-primaryLight px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${className}`}
      title={lang === 'ru' ? 'Экспорт в Excel' : 'Excelga eksport'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      {label || (lang === 'ru' ? 'Экспорт' : 'Eksport')}
    </button>
  );
}

export default ExportButton;
