import React from 'react';
import { Line } from 'react-chartjs-2';
import { crosshairPlugin, heroTooltipOptions } from '../../chartCrosshair';

function HeroChartCard({ title, value, delta, caption, data, breakdown = [] }) {
  const up = typeof delta === 'number' ? delta >= 0 : null;
  const maxBreakdown = Math.max(...breakdown.map(b => b.value), 1);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: heroTooltipOptions,
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    },
    elements: { point: { radius: 0, hoverRadius: 5 } },
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-[13rem_1fr] gap-6 items-start">
        <div>
          <h4 className="font-semibold text-sm text-gov-text mb-4">{title}</h4>
          <p className="text-[34px] leading-none font-bold text-gov-text tracking-tight">{value}</p>
          {(delta !== undefined && delta !== null) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gov-muted">
                {up ? '▲' : '▼'} {Math.abs(delta)}%
              </span>
              {caption && <span className="text-xs text-gov-muted">{caption}</span>}
            </div>
          )}
        </div>
        <div className="h-56">
          <Line data={data} options={options} plugins={[crosshairPlugin]} />
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-5 bg-gov-light/60 rounded-xl p-4">
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${breakdown.length}, minmax(0, 1fr))` }}>
            {breakdown.map((b, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  {b.icon && (
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${b.color}1a`, color: b.color }}
                    >
                      {b.icon}
                    </span>
                  )}
                  <span className="text-lg font-bold text-gov-text">{b.value}</span>
                </div>
                <p className="text-xs text-gov-muted mt-1">{b.label}</p>
                <div className="h-1.5 rounded-full bg-gov-border mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(6, (b.value / maxBreakdown) * 100)}%`, backgroundColor: b.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroChartCard;
