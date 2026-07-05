import React from 'react';

const TONES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  danger: 'bg-rose-50 text-gov-danger border-rose-100',
  warning: 'bg-amber-50 text-gov-warning border-amber-100',
  primary: 'bg-gov-primaryLight text-gov-primary border-blue-100',
  neutral: 'bg-gov-light text-gov-muted border-gov-border',
};

function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border leading-none ${TONES[tone] || TONES.neutral} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
