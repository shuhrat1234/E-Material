import React from 'react';
import Sparkline from './Sparkline';

function StatCard({ icon, tone = 'primary', value, label, delta, caption, trend, className = '' }) {
  const up = typeof delta === 'number' ? delta >= 0 : null;
  const isCritical = tone === 'danger' && typeof value === 'number' ? value > 0 : false;
  return (
    <div className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-5 text-left ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gov-muted">{label}</p>
        {icon && (
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-gov-light text-gov-muted">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={`text-[26px] leading-none font-bold tracking-tight ${isCritical ? 'text-gov-danger' : 'text-gov-text'}`}>{value}</p>
          {(delta !== undefined && delta !== null) || caption ? (
            <div className="flex items-center gap-2 mt-3">
              {delta !== undefined && delta !== null && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gov-muted">
                  {up ? '▲' : '▼'} {Math.abs(delta)}%
                </span>
              )}
              {caption && <span className="text-xs text-gov-muted">{caption}</span>}
            </div>
          ) : null}
        </div>
        {trend && trend.length > 1 && (
          <Sparkline data={trend} />
        )}
      </div>
    </div>
  );
}

export default StatCard;
