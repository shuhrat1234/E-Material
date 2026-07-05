import React from 'react';

function PillBarChart({ title, data = [], trackHeight = 160 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 text-left h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold text-sm text-gov-text">{title}</h4>
        <span className="flex gap-0.5 shrink-0">
          <span className="w-1 h-1 rounded-full bg-gov-border" />
          <span className="w-1 h-1 rounded-full bg-gov-border" />
          <span className="w-1 h-1 rounded-full bg-gov-border" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2 flex-1">
        {data.map((d, i) => {
          const isMax = d.value === max && max > 0;
          const pct = max > 0 ? (d.value / max) * 100 : 4;
          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0">
              <span className={`mb-1 h-[18px] text-sm font-bold text-gov-text ${isMax ? '' : 'invisible'}`}>{d.value}</span>
              <div className="w-full max-w-[30px] bg-gov-light rounded-full flex items-end overflow-hidden" style={{ height: trackHeight }}>
                <div
                  className="w-full rounded-full transition-all duration-500"
                  style={{
                    height: `${Math.max(pct, 6)}%`,
                    background: isMax ? 'linear-gradient(180deg, #3b82f6, #93c5fd)' : '#e2e8f0',
                  }}
                />
              </div>
              <span className={`mt-2 text-xs truncate max-w-full ${isMax ? 'font-semibold text-gov-primary' : 'text-gov-muted'}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PillBarChart;
