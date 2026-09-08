import React, { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import MahallaMap from './ui/MahallaMap';
import { MapIcon } from './Icons';
import { useSettings } from '../settingsContext';
import { OLMAZOR_MAHALLAS } from '../data/olmazorMahallas';
import { useVoronoiCells, severityStyle, getMahallaZone } from '../mahallaVoronoi';

// Static preview of the crime map for the dashboard home panel with live risk zone pills
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

  const zoneCounts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;
    OLMAZOR_MAHALLAS.forEach(m => {
      const count = (byMahalla[m.id] || []).length;
      const zone = getMahallaZone(count, maxCount);
      if (zone.key === 'red') red++;
      else if (zone.key === 'yellow') yellow++;
      else green++;
    });
    return { red, yellow, green };
  }, [byMahalla, maxCount]);

  const emptyFill = isDark ? [30, 41, 59] : [226, 232, 240];
  const emptyBorder = isDark ? 'rgba(71,85,105,0.45)' : 'rgba(148,163,184,0.45)';

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
              color: count > 0 ? `rgba(${r},${g},${b},0.8)` : emptyBorder,
              weight: count > 0 ? 1 : 0.6,
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
      className="w-full text-left bg-gov-surface rounded-2xl shadow-card hover:shadow-card-hover border border-gov-border/80 transition-all overflow-hidden group"
    >
      <div className="p-3.5 sm:px-5 sm:pt-4 sm:pb-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h5 className="font-bold text-xs sm:text-sm text-gov-text flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <MapIcon className="h-4 w-4 text-gov-primary shrink-0" />
            <span className="whitespace-nowrap">{lang === 'ru' ? 'Карта преступлений района' : 'Hudud jinoyatlar xaritasi'}</span>
          </h5>

          <span className="text-[11px] sm:text-xs font-bold text-gov-primary bg-gov-primaryLight px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg group-hover:bg-gov-primary group-hover:text-white transition-all shrink-0 whitespace-nowrap">
            <span className="hidden sm:inline">{lang === 'ru' ? 'Открыть карту →' : 'Xaritani ochish →'}</span>
            <span className="sm:hidden">{lang === 'ru' ? 'Открыть →' : 'Ochish →'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {zoneCounts.red} {lang === 'ru' ? 'красных' : 'qizil'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            {zoneCounts.yellow} {lang === 'ru' ? 'жёлтых' : 'sariq'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            {zoneCounts.green} {lang === 'ru' ? 'зелёных' : 'yashil'}
          </span>
        </div>
      </div>

      <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
        <MahallaMap
          height="220px"
          mapType="streets"
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

