// Validated categorical palette (see dataviz skill / references/palette.md).
// Fixed hue order — never cycle or reassign per-filter.
export const CATEGORICAL = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#e34948', '#e87ba4'];

// Single-hue sequential ramp (blue), light -> dark, for magnitude-only series.
export const SEQUENTIAL = ['#cde2fb', '#9ec5f4', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b'];

// Chart.js draws to canvas (not CSS), so text/gridline colors need to be
// passed explicitly per-theme rather than inherited from Tailwind classes.
export function chartTheme(isDark) {
  return {
    textColor: isDark ? '#cbd5e1' : '#475569',
    gridColor: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(100, 116, 139, 0.12)',
  };
}
