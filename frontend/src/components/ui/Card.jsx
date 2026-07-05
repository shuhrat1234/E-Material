import React from 'react';

export function Card({ children, className = '', padded = true, hover = false }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card ${hover ? 'transition-shadow hover:shadow-card-hover' : ''} ${padded ? 'p-5' : ''} text-left ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ icon, iconTone = 'primary', title, action }) {
  const tones = {
    primary: 'bg-gov-primaryLight text-gov-primary',
    success: 'bg-emerald-50 text-emerald-600',
    danger: 'bg-rose-50 text-gov-danger',
    warning: 'bg-amber-50 text-gov-warning',
    neutral: 'bg-gov-light text-gov-muted',
  };
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tones[iconTone] || tones.primary}`}>
            {icon}
          </span>
        )}
        <h4 className="font-semibold text-sm text-gov-text">{title}</h4>
      </div>
      {action}
    </div>
  );
}

export default Card;
