import React, { useMemo, useState } from 'react';
import L from 'leaflet';
import { Marker, Tooltip } from 'react-leaflet';
import MahallaMap from './ui/MahallaMap';
import Card, { CardHeader } from './ui/Card';
import { MapIcon } from './Icons';
import { SEQUENTIAL } from '../chartColors';
import { useSettings } from '../settingsContext';
import { MATERIAL_TYPES } from '../materialTaxonomy';
import { OLMAZOR_MAHALLAS } from '../data/olmazorMahallas';

const MIN_SIZE = 16;
const MAX_SIZE = 72;

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(clean.substring(i, i + 2), 16));
}

// Proportional-symbol (bubble) map, not a choropleth: OpenStreetMap only has real
// polygon shapes for a fraction of Olmazor's mahallas, so every mahalla is a soft
// glowing marker sized/colored by case count instead — see plan notes on data
// availability. Markers are custom Leaflet divIcons (radial-gradient blob + blur
// glow) rather than flat CircleMarkers so hovering reads as illuminating the
// mahalla's area, not just lighting up a dot.
function CrimeMapPanel({ materials, lang, onOpenMaterialsList }) {
  const { isDark } = useSettings();
  const [selectedId, setSelectedId] = useState(null);
  const mutedRgb = isDark ? [148, 163, 184] : [100, 116, 139];

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
  // crime" the marker's size/color alone can't show).
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

  const getMarkerProps = (mahalla) => {
    const list = byMahalla[mahalla.id] || [];
    const count = list.length;
    const isSelected = mahalla.id === selectedId;
    const tooltip = buildTooltip(mahalla, count, list);

    if (count === 0) {
      const [r, g, b] = mutedRgb;
      return {
        size: isSelected ? 16 : 10,
        tooltip,
        background: `radial-gradient(circle at 42% 38%, rgba(${r},${g},${b},0.55) 0%, rgba(${r},${g},${b},0.25) 55%, rgba(${r},${g},${b},0) 78%)`,
        ring: isSelected ? '2px solid #ffffff' : `1px solid rgba(${r},${g},${b},0.5)`,
        glow: isSelected ? `0 0 10px rgba(${r},${g},${b},0.6)` : 'none',
      };
    }

    const ratio = count / maxCount;
    const bucket = Math.min(SEQUENTIAL.length - 1, Math.floor(ratio * (SEQUENTIAL.length - 1)));
    const [r, g, b] = hexToRgb(SEQUENTIAL[bucket]);
    const size = MIN_SIZE + Math.sqrt(ratio) * (MAX_SIZE - MIN_SIZE);
    return {
      size,
      tooltip,
      background: `radial-gradient(circle at 42% 38%, rgba(${r},${g},${b},0.95) 0%, rgba(${r},${g},${b},0.6) 48%, rgba(${r},${g},${b},0) 78%)`,
      ring: isSelected ? '2.5px solid #ffffff' : `1.5px solid rgba(${r},${g},${b},0.9)`,
      glow: `0 0 ${10 + ratio * 22}px rgba(${r},${g},${b},${isSelected ? 0.85 : 0.6})`,
    };
  };

  const renderMarker = (mahalla, props, onClick) => {
    const boxSize = Math.ceil(props.size + 14); // headroom so the hover scale-up glow isn't clipped
    const icon = L.divIcon({
      className: 'mahalla-marker-wrapper',
      html: `<div class="mahalla-marker-inner" style="background:${props.background};border:${props.ring};box-shadow:${props.glow};"></div>`,
      iconSize: [boxSize, boxSize],
      iconAnchor: [boxSize / 2, boxSize / 2],
    });
    return (
      <Marker
        key={mahalla.id}
        position={[mahalla.lat, mahalla.lon]}
        icon={icon}
        eventHandlers={{ click: () => onClick(mahalla) }}
      >
        <Tooltip direction="top" offset={[0, -boxSize / 2]}>{props.tooltip}</Tooltip>
      </Marker>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="flex-1 w-full min-w-0">
        <MahallaMap
          height="560px"
          getMarkerProps={getMarkerProps}
          renderMarker={renderMarker}
          onMarkerClick={(m) => setSelectedId(prev => (prev === m.id ? null : m.id))}
        />
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
