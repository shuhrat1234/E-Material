// Lightweight dashed crosshair + highlighted point for Chart.js line charts,
// drawn from the active tooltip element (mode: 'index', intersect: false).
export const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart) {
    const active = chart.tooltip?._active;
    if (!active || !active.length) return;
    const { ctx, chartArea: { top, bottom } } = chart;
    const x = active[0].element.x;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#cbd5e1';
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.restore();
  },
};

export const heroTooltipOptions = {
  enabled: true,
  mode: 'index',
  intersect: false,
  backgroundColor: '#ffffff',
  titleColor: '#0f172a',
  bodyColor: '#334155',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  displayColors: true,
  boxPadding: 3,
  titleFont: { weight: '600', size: 12 },
  bodyFont: { size: 12 },
};
