import React, { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import MahallaMap from './ui/MahallaMap';
import { MapIcon } from './Icons';
import { useSettings } from '../settingsContext';
import { OLMAZOR_MAHALLAS } from '../data/olmazorMahallas';
import { useVoronoiCells, severityStyle } from '../mahallaVoronoi';

// Static (non-interactive) preview of the crime map for the dashboard home panel —
// same severity-colored Voronoi cells as the full CrimeMapPanel, just read-only.
// The whole card is one big "open the full map" button.
function CrimeMapMini({ materials, lang, onOpen }) {
  const { isDark } = useSettings();
  const cells = useVoronoiCells();

  const byMahalla = useMemo(() => {
    const map = {};
    for (const m of materials) {
      if (!m.mahalla) continue;
      (map[m.mahalla] = map[m.mahalla] || []).push(m);
    }
    return map;
  }, [materials]);

  const maxCount = useMemo(
    () => Math.max(1, ...OLMAZOR_MAHALLAS.map(m => (byMahalla[m.id] || []).length)),
    [byMahalla]
  );

  const emptyFill = isDark ? [51, 65, 85] : [203, 213, 225];
  const emptyBorder = isDark ? 'rgba(203,213,225,0.4)' : 'rgba(71,85,105,0.4)';

  const overlayLayers = (
    <>
      {cells.map(({ mahalla, positions, key }) => {
        const count = (byMahalla[mahalla.id] || []).length;
        const { fillRgb, baseFillOpacity } = severityStyle(count, maxCount, emptyFill);
        const [r, g, b] = fillRgb;
        return (
          <Polygon
            key={key}
            positions={positions}
            pathOptions={{
              color: emptyBorder,
              weight: 0.75,
              fillColor: `rgb(${r},${g},${b})`,
              fillOpacity: baseFillOpacity,
              opacity: 1,
              interactive: false,
            }}
          />
        );
      })}
    </>
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-gov-surface rounded-2xl shadow-card hover:shadow-card-hover transition-shadow overflow-hidden group"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h5 className="font-semibold text-sm text-gov-text flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-gov-primary" />
          {lang === 'ru' ? 'Карта преступлений' : 'Jinoyatlar xaritasi'}
        </h5>
        <span className="text-[11px] font-semibold text-gov-primary group-hover:underline">
          {lang === 'ru' ? 'Открыть →' : 'Ochish →'}
        </span>
      </div>
      <div className="px-3 pb-3">
        <MahallaMap
          height="220px"
          overlayLayers={overlayLayers}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          doubleClickZoom={false}
          className="pointer-events-none"
        />
      </div>
    </button>
  );
}

export default CrimeMapMini;
