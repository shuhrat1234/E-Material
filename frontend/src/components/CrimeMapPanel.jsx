import React, { useMemo, useState } from 'react';
import { Delaunay } from 'd3-delaunay';
import polygonClipping from 'polygon-clipping';
import { Polygon, Tooltip } from 'react-leaflet';
import MahallaMap from './ui/MahallaMap';
import Card, { CardHeader } from './ui/Card';
import { MapIcon } from './Icons';
import { SEQUENTIAL } from '../chartColors';
import { useSettings } from '../settingsContext';
import { MATERIAL_TYPES } from '../materialTaxonomy';
import { OLMAZOR_MAHALLAS } from '../data/olmazorMahallas';
import { OLMAZOR_BOUNDARY, OLMAZOR_BOUNDS } from '../data/olmazorBoundary';

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(clean.substring(i, i + 2), 16));
}

// Each mahalla only has a point in OpenStreetMap, not a real boundary polygon for
// most of them (see the original build's plan notes). A Voronoi tessellation of
// the 64 points gives every mahalla a real, derived "zone" — the area closer to
// it than to any other mahalla — so hovering highlights a whole area with a
// border, not just a small dot. It's a computed proximity region, not an
// official boundary; the tooltip still names the exact mahalla.
//
// Voronoi cells are only bounded to a rectangle, so each one is then clipped
// against the true district polygon (via polygon-clipping — a real geometric
// intersection, not a fill-rule masking trick) to stay inside Olmazor tumani.
// A cell can split into more than one piece where the district's edge is
// concave, so each mahalla maps to one or more polygon pieces.
function useVoronoiCells() {
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

function CrimeMapPanel({ materials, lang, onOpenMaterialsList }) {
  const { isDark } = useSettings();
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
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

  const selected = selectedId ? OLMAZOR_MAHALLAS.find(m => m.id === selectedId) : null;
  const selectedMaterials = selected ? (byMahalla[selected.id] || []) : [];
  const untaggedCount = materials.length - Object.values(byMahalla).reduce((sum, list) => sum + list.length, 0);

  const breakdownFor = (list) => MATERIAL_TYPES
    .map(t => ({ ...t, count: list.filter(m => (m.material_type || 'e_material') === t.value).length }))
    .filter(t => t.count > 0);

  // Hover tooltip: name, total, and the per-type breakdown (the "what kind of
  // crime" a fill color alone can't show).
  const buildTooltip = (mahalla, count, list) => {
    const name = lang === 'ru' ? mahalla.name_ru : mahalla.name_uz;
    const breakdown = breakdownFor(list);
    return (
      <div className="text-xs min-w-[9rem]">
        <p className="font-bold text-[13px]">{name}</p>
        <p className="text-gov-muted mt-0.5">
          {lang === 'ru' ? 'Всего' : 'Jami'}: <span className="font-semibold text-gov-text">{count}</span>
        </p>
        {breakdown.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-gov-border space-y-0.5">
            {breakdown.map(b => (
              <p key={b.value} className="flex items-center justify-between gap-4">
                <span className="text-gov-muted">{lang === 'ru' ? b.ru : b.uz}</span>
                <span className="font-semibold text-gov-text">{b.count}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const emptyFill = isDark ? [30, 41, 59] : [226, 232, 240];
  const emptyBorder = isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.35)';

  const overlayLayers = (
    <>
      {cells.map(({ mahalla, positions, key }) => {
        const list = byMahalla[mahalla.id] || [];
        const count = list.length;
        const isSelected = mahalla.id === selectedId;
        const isHovered = mahalla.id === hoveredId;
        const emphasized = isSelected || isHovered;

        let fillRgb = emptyFill;
        let baseFillOpacity = 0.12;
        if (count > 0) {
          const ratio = count / maxCount;
          const bucket = Math.min(SEQUENTIAL.length - 1, Math.floor(ratio * (SEQUENTIAL.length - 1)));
          fillRgb = hexToRgb(SEQUENTIAL[bucket]);
          baseFillOpacity = 0.32 + ratio * 0.3;
        }
        const [r, g, b] = fillRgb;

        return (
          <Polygon
            key={key}
            positions={positions}
            pathOptions={{
              color: emphasized ? '#ffffff' : emptyBorder,
              weight: emphasized ? 2.5 : 1,
              fillColor: `rgb(${r},${g},${b})`,
              fillOpacity: isHovered ? Math.min(0.85, baseFillOpacity + 0.3) : baseFillOpacity,
              opacity: 1,
            }}
            eventHandlers={{
              mouseover: (e) => { setHoveredId(mahalla.id); e.target.bringToFront(); },
              mouseout: () => setHoveredId(null),
              click: () => setSelectedId(prev => (prev === mahalla.id ? null : mahalla.id)),
            }}
          >
            <Tooltip sticky opacity={1}>{buildTooltip(mahalla, count, list)}</Tooltip>
          </Polygon>
        );
      })}
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="flex-1 w-full min-w-0">
        <MahallaMap height="560px" overlayLayers={overlayLayers} />
        {untaggedCount > 0 && (
          <p className="text-[11px] text-gov-muted mt-2">
            {lang === 'ru'
              ? `Без привязки к махалле: ${untaggedCount}`
              : `Mahallaga bog'lanmagan: ${untaggedCount}`}
          </p>
        )}
      </div>

      <div className="w-full lg:w-80 shrink-0">
        <Card>
          {!selected ? (
            <div className="text-center py-10 text-gov-muted text-xs font-semibold">
              <MapIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
              {lang === 'ru' ? 'Нажмите на махаллю на карте' : 'Xaritada mahallani bosing'}
            </div>
          ) : (
            <>
              <CardHeader
                icon={<MapIcon className="h-4 w-4" />}
                title={lang === 'ru' ? selected.name_ru : selected.name_uz}
              />
              <p className="text-xs text-gov-muted -mt-3 mb-4">
                {lang === 'ru' ? 'Всего материалов' : 'Jami materiallar'}:{' '}
                <span className="font-bold text-gov-text">{selectedMaterials.length}</span>
              </p>
              <div className="space-y-1.5">
                {MATERIAL_TYPES.map(t => {
                  const typeMaterials = selectedMaterials.filter(m => (m.material_type || 'e_material') === t.value);
                  return (
                    <button
                      key={t.value}
                      disabled={typeMaterials.length === 0}
                      onClick={() => onOpenMaterialsList(
                        `${lang === 'ru' ? selected.name_ru : selected.name_uz} — ${lang === 'ru' ? t.ru : t.uz}`,
                        typeMaterials
                      )}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gov-text hover:bg-gov-light transition-colors disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      <span>{lang === 'ru' ? t.ru : t.uz}</span>
                      <span className="min-w-[1.5rem] h-5 px-1.5 rounded-full bg-gov-primaryLight text-gov-primary text-[10px] font-bold inline-flex items-center justify-center">
                        {typeMaterials.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default CrimeMapPanel;
