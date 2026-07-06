import React from 'react';
import Sparkline from './Sparkline';

const ICON_TONES = {
  primary: 'bg-blue-50 text-gov-primary',
  success: 'bg-emerald-50 text-emerald-600',
  danger: 'bg-rose-50 text-gov-danger',
  warning: 'bg-amber-50 text-gov-warning',
  neutral: 'bg-gov-light text-gov-muted',
};

function StatCard({ icon, tone = 'primary', value, label, delta, caption, trend, className = '' }) {
  const up = typeof delta === 'number' ? delta >= 0 : null;
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isPositiveNumber = !isNaN(numericValue) && numericValue > 0;
  const valueColorClass =
    tone === 'danger' && isPositiveNumber ? 'text-gov-danger' :
    tone === 'success' && isPositiveNumber ? 'text-gov-success' :
    'text-gov-text';
  return (
    <div className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-5 text-left ${className}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm font-medium text-gov-muted min-w-0">{label}</p>
        {icon && (
          <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ICON_TONES[tone] || ICON_TONES.primary}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className={`text-[26px] leading-none font-bold tracking-tight truncate ${valueColorClass}`}>{value}</p>
          {(delta !== undefined && delta !== null) || caption ? (
            <div className="flex items-center gap-2 mt-3">
              {delta !== undefined && delta !== null && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gov-muted whitespace-nowrap">
                  {up ? '▲' : '▼'} {Math.abs(delta)}%
                </span>
              )}
              {caption && <span className="text-xs text-gov-muted whitespace-nowrap">{caption}</span>}
            </div>
          ) : null}
        </div>
        {trend && trend.length > 1 && (
          <span className="shrink-0">
            <Sparkline data={trend} />
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
