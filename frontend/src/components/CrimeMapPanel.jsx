import React, { useMemo, useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { Marker, Polygon, Tooltip } from 'react-leaflet';
import MahallaMap from './ui/MahallaMap';
import Card, { CardHeader } from './ui/Card';
import { MapIcon } from './Icons';
import { useSettings } from '../settingsContext';
import { MATERIAL_TYPES } from '../materialTaxonomy';
import { OLMAZOR_MAHALLAS } from '../data/olmazorMahallas';
import { useVoronoiCells, severityStyle, shortName } from '../mahallaVoronoi';

function CrimeMapPanel({ materials, lang, onOpenMaterialsList }) {
  const { isDark } = useSettings();
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const cells = useVoronoiCells();
  const detailsRef = useRef(null);

  // The details card sits beside the map on wide screens but drops below it on
  // narrow ones (flex-col below the lg breakpoint) — easy to click a cell and not
  // notice the result appeared off-screen. Bring it into view on every selection.
  useEffect(() => {
    if (selectedId && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

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

  const emptyFill = isDark ? [51, 65, 85] : [203, 213, 225];
  const emptyBorder = isDark ? 'rgba(203,213,225,0.55)' : 'rgba(71,85,105,0.55)';
  const highlightBorder = isDark ? '#f8fafc' : '#0f172a'; // hover/select ring — a fixed dark/light outline, not a color swap, so severity color stays legible

  // react-leaflet re-binds a Polygon's Leaflet event listeners (off the old
  // object, on the new one) whenever the `eventHandlers` prop's *reference*
  // changes — it doesn't diff contents. Building this object inline in the
  // render below would recreate it (and force an unbind/rebind cycle across
  // all ~65 cells) on every hover, which raced against real mouse events often
  // enough that hover/click could end up permanently unbound. Keying handlers
  // by mahalla id here keeps each cell's object reference stable across
  // hoveredId/selectedId changes, so react-leaflet only binds them once.
  const cellHandlers = useMemo(() => {
    const map = {};
    cells.forEach(({ mahalla }) => {
      if (map[mahalla.id]) return;
      map[mahalla.id] = {
        mouseover: (e) => { setHoveredId(mahalla.id); e.target.bringToFront(); },
        mouseout: () => setHoveredId(null),
        click: () => setSelectedId(prev => (prev === mahalla.id ? null : mahalla.id)),
      };
    });
    return map;
  }, [cells]);

  const overlayLayers = (
    <>
      {cells.map(({ mahalla, positions, key }) => {
        const list = byMahalla[mahalla.id] || [];
        const count = list.length;
        const isSelected = mahalla.id === selectedId;
        const isHovered = mahalla.id === hoveredId;
        const emphasized = isSelected || isHovered;

        const { fillRgb, baseFillOpacity } = severityStyle(count, maxCount, emptyFill);
        const [r, g, b] = fillRgb;

        return (
          <Polygon
            key={key}
            positions={positions}
            pathOptions={{
              color: emphasized ? highlightBorder : emptyBorder,
              weight: emphasized ? 3 : 1.25,
              fillColor: `rgb(${r},${g},${b})`,
              fillOpacity: emphasized ? Math.min(0.95, baseFillOpacity + 0.2) : baseFillOpacity,
              opacity: 1,
            }}
            eventHandlers={cellHandlers[mahalla.id]}
          >
            <Tooltip sticky opacity={1}>{buildTooltip(mahalla, count, list)}</Tooltip>
          </Polygon>
        );
      })}
      {OLMAZOR_MAHALLAS.map(mahalla => {
        const label = shortName(lang === 'ru' ? mahalla.name_ru : mahalla.name_uz);
        const icon = L.divIcon({
          className: 'mahalla-label-marker',
          html: `<span class="mahalla-label-text">${label}</span>`,
          iconSize: [0, 0],
        });
        return (
          <Marker
            key={`label_${mahalla.id}`}
            position={[mahalla.lat, mahalla.lon]}
            icon={icon}
            interactive={false}
            keyboard={false}
          />
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

      <div className="w-full lg:w-80 shrink-0" ref={detailsRef}>
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
