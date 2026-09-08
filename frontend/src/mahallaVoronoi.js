import { useMemo } from 'react';
import { Delaunay } from 'd3-delaunay';
import polygonClipping from 'polygon-clipping';
import { OLMAZOR_MAHALLAS } from './data/olmazorMahallas';
import { OLMAZOR_BOUNDARY, OLMAZOR_BOUNDS } from './data/olmazorBoundary';

// Shared by CrimeMapPanel (full page) and CrimeMapMini (dashboard preview) so the
// Voronoi/severity-color logic lives in exactly one place.

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(clean.substring(i, i + 2), 16));
}

// Crime-severity ramp: green (few/no cases) -> yellow (moderate) -> red (heavy),
// the traffic-light convention for a risk map.
export const SEVERITY = ['#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444'];

// Official Uzbekistan Ministry of Internal Affairs (IIV) Mahalla Categorization
// "Yashil hudud" (Green zone) - Safe / Minimal crimes
// "Sariq hudud" (Yellow zone) - Moderate / Watchlist
// "Qizil hudud" (Red zone) - High crime / Enhanced patrol & prevention
export const RISK_ZONES = {
  red: {
    key: 'red',
    color: '#ef4444',
    rgb: [239, 68, 68],
    bgClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    dotClass: 'bg-red-500',
    uz: 'Qizil hudud',
    ru: 'Красная зона',
    descUz: 'Yuqori xavf guruhi (kuchaytirilgan nazorat)',
    descRu: 'Высокий уровень риска (усиленный контроль)',
  },
  yellow: {
    key: 'yellow',
    color: '#f59e0b',
    rgb: [245, 158, 11],
    bgClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-500',
    uz: 'Sariq hudud',
    ru: 'Жёлтая зона',
    descUz: 'O\'rta xavf guruhi (profilaktik nazorat)',
    descRu: 'Средний уровень риска (профилактика)',
  },
  green: {
    key: 'green',
    color: '#10b981',
    rgb: [16, 185, 129],
    bgClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    uz: 'Yashil hudud',
    ru: 'Зелёная зона',
    descUz: 'Tinch va barqaror hudud',
    descRu: 'Спокойная и стабильная зона',
  },
};

export function getMahallaZone(count, maxCount) {
  if (count === 0) return RISK_ZONES.green;
  // If count is in top 40% of maxCount or >= 5
  if (count >= Math.max(3, maxCount * 0.55)) {
    return RISK_ZONES.red;
  }
  if (count >= Math.max(2, maxCount * 0.22)) {
    return RISK_ZONES.yellow;
  }
  return RISK_ZONES.green;
}

// Drop the generic "mahalla/dahasi/massiv" suffix word for the on-map label so it
// fits inside a small cell — the full name is still available in tooltips.
const NAME_SUFFIXES = /\s+(mahallasi|maxallasi|mahalla|dahasi|massivi?|shaharchasi|tumani)$/i;
const NAME_SUFFIXES_RU = /\s+(махалля|массив|шахарчаси|туман[аи]?)$/i;
export function shortName(name) {
  return name.replace(NAME_SUFFIXES, '').replace(NAME_SUFFIXES_RU, '').trim();
}

// Each mahalla only has a point in OpenStreetMap, not a real boundary polygon for
// most of them. A Voronoi tessellation of the 64 points gives every mahalla a
// real, derived "zone" — the area closer to it than to any other mahalla — so
// hovering highlights a whole area with a border, not just a small dot.
export function useVoronoiCells() {
  return useMemo(() => {
    const pad = 0.02;
    const points = OLMAZOR_MAHALLAS.map(m => [m.lon, m.lat]);
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([
      OLMAZOR_BOUNDS.west - pad, OLMAZOR_BOUNDS.south - pad,
      OLMAZOR_BOUNDS.east + pad, OLMAZOR_BOUNDS.north + pad,
    ]);
    const boundaryLonLat = [OLMAZOR_BOUNDARY.map(([lat, lon]) => [lon, lat])];

    const cells = [];
    OLMAZOR_MAHALLAS.forEach((mahalla, i) => {
      const cell = voronoi.cellPolygon(i);
      if (!cell) return;
      const clipped = polygonClipping.intersection([cell], boundaryLonLat);
      clipped.forEach((polygon, pieceIndex) => {
        const positions = polygon[0].map(([lon, lat]) => [lat, lon]);
        cells.push({ mahalla, positions, key: `${mahalla.id}_${pieceIndex}` });
      });
    });
    return cells;
  }, []);
}

// count -> { fillRgb: [r,g,b], baseFillOpacity } using the SEVERITY ramp.
export function severityStyle(count, maxCount, emptyFillRgb) {
  if (count === 0) return { fillRgb: emptyFillRgb, baseFillOpacity: 0.35 };
  const ratio = Math.min(1, count / maxCount);
  const bucket = Math.min(SEVERITY.length - 1, Math.floor(ratio * (SEVERITY.length - 1)));
  return { fillRgb: hexToRgb(SEVERITY[bucket]), baseFillOpacity: 0.52 + ratio * 0.35 };
}

