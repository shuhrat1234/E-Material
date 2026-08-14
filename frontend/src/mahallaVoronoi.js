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
// the traffic-light convention for a risk map. Bucketed by count relative to the
// busiest mahalla, same idea as a sequential ramp but three hues instead of one.
export const SEVERITY = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

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
// hovering highlights a whole area with a border, not just a small dot. It's a
// computed proximity region, not an official boundary.
//
// Voronoi cells are only bounded to a rectangle, so each one is then clipped
// against the true district polygon (via polygon-clipping — a real geometric
// intersection, not a fill-rule masking trick) to stay inside Olmazor tumani.
// A cell can split into more than one piece where the district's edge is
// concave, so each mahalla maps to one or more polygon pieces.
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
  if (count === 0) return { fillRgb: emptyFillRgb, baseFillOpacity: 0.4 };
  const ratio = count / maxCount;
  const bucket = Math.min(SEVERITY.length - 1, Math.floor(ratio * (SEVERITY.length - 1)));
  return { fillRgb: hexToRgb(SEVERITY[bucket]), baseFillOpacity: 0.5 + ratio * 0.3 };
}
