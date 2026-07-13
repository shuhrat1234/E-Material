import React from 'react';
import Sparkline from './Sparkline';

const ICON_TONES = {
  primary: 'bg-gov-primaryLight text-gov-primary',
  success: 'bg-gov-successLight text-gov-success',
  danger: 'bg-gov-dangerLight text-gov-danger',
  warning: 'bg-gov-warningLight text-gov-warning',
  info: 'bg-gov-infoLight text-gov-info',
  cyan: 'bg-gov-cyanLight text-gov-cyan',
  pink: 'bg-gov-pinkLight text-gov-pink',
  neutral: 'bg-gov-light text-gov-muted',
};

const PULSE_TONES = {
  primary: 'bg-gov-primary',
  success: 'bg-gov-success',
  danger: 'bg-gov-danger',
  warning: 'bg-gov-warning',
  info: 'bg-gov-info',
  cyan: 'bg-gov-cyan',
  pink: 'bg-gov-pink',
};

const TONE_VAR = {
  primary: '--gov-primary',
  success: '--gov-success',
  danger: '--gov-danger',
  warning: '--gov-warning',
  info: '--gov-info',
  cyan: '--gov-cyan',
  pink: '--gov-pink',
  neutral: '--gov-muted',
};

const VALUE_TONES = {
  primary: 'text-gov-primary',
  success: 'text-gov-success',
  danger: 'text-gov-danger',
  warning: 'text-gov-warning',
  info: 'text-gov-info',
  cyan: 'text-gov-cyan',
  pink: 'text-gov-pink',
  neutral: 'text-gov-text',
};

function StatCard({ icon, tone = 'primary', value, label, delta, caption, trend, className = '', onClick }) {
  const up = typeof delta === 'number' ? delta >= 0 : null;
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isPositiveNumber = !isNaN(numericValue) && numericValue > 0;
  const valueColorClass = VALUE_TONES[tone] || VALUE_TONES.primary;
  const shouldPulse = tone === 'danger' && isPositiveNumber;
  const toneVarValue = `rgb(var(${TONE_VAR[tone] || TONE_VAR.primary}))`;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`group relative bg-gov-surface rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-5 pt-[1.15rem] text-left overflow-hidden w-full ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    >
      <span
        className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"
        style={{ backgroundColor: toneVarValue }}
      />
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm font-medium text-gov-muted min-w-0">{label}</p>
        {icon && (
          <span className="relative w-9 h-9 shrink-0" style={{ animation: 'badgePop 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {shouldPulse && (
              <span className={`absolute inset-0 rounded-full animate-ping opacity-40 ${PULSE_TONES[tone] || PULSE_TONES.primary}`} />
            )}
            <span
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${ICON_TONES[tone] || ICON_TONES.primary}`}
            >
              {icon}
            </span>
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
            <Sparkline data={trend} color={toneVarValue} />
          </span>
        )}
      </div>
    </Tag>
  );
}

export default StatCard;
