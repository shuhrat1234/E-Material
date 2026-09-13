import React, { useMemo, useState } from 'react';
import { Polygon, Tooltip, CircleMarker } from 'react-leaflet';
import MahallaMap from './MahallaMap';
import Select from './Select';
import { MapIcon, CloseIcon } from '../Icons';
import { useSettings } from '../../settingsContext';
import { OLMAZOR_MAHALLAS } from '../../data/olmazorMahallas';
import { useVoronoiCells } from '../../mahallaVoronoi';

// Interactive Voronoi mahalla picker matching Boshliq styling — each mahalla is an
// actual geographic district zone that lights up on hover/click with smooth camera focus.
function MahallaPicker({ value, onChange, lang, error }) {
  const [hoveredId, setHoveredId] = useState(null);
  const { isDark } = useSettings();
  const cells = useVoronoiCells();

  const selected = value ? OLMAZOR_MAHALLAS.find(m => m.id === value) : null;

  const options = useMemo(
    () => [...OLMAZOR_MAHALLAS]
      .sort((a, b) => (lang === 'ru' ? a.name_ru.localeCompare(b.name_ru) : a.name_uz.localeCompare(b.name_uz)))
      .map(m => ({ value: m.id, label: lang === 'ru' ? m.name_ru : m.name_uz })),
    [lang]
  );

  const emptyFill = isDark ? [30, 41, 59] : [226, 232, 240];
  const emptyBorder = isDark ? 'rgba(71,85,105,0.6)' : 'rgba(148,163,184,0.6)';

  const overlayLayers = useMemo(() => {
    return (
      <>
        {cells.map(({ mahalla, positions, key }) => {
          const isSelected = mahalla.id === value;
          const isHovered = mahalla.id === hoveredId;

          const fillColor = isSelected
            ? '#2563eb'
            : isHovered
            ? '#60a5fa'
            : `rgb(${emptyFill[0]},${emptyFill[1]},${emptyFill[2]})`;

          const fillOpacity = isSelected ? 0.75 : isHovered ? 0.45 : 0.25;

          const strokeColor = isSelected
            ? '#1d4ed8'
            : isHovered
            ? '#2563eb'
            : emptyBorder;

          const weight = isSelected ? 2.5 : isHovered ? 2 : 0.8;

          return (
            <Polygon
              key={key}
              positions={positions}
              pathOptions={{
                color: strokeColor,
                weight,
                fillColor,
                fillOpacity,
                opacity: 1,
              }}
              eventHandlers={{
                mouseover: (e) => {
                  setHoveredId(mahalla.id);
                  e.target.bringToFront();
                },
                mouseout: () => setHoveredId(null),
                click: () => {
                  onChange(mahalla.id === value ? '' : mahalla.id);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                <span className="font-semibold text-xs text-gov-text">
                  {lang === 'ru' ? mahalla.name_ru : mahalla.name_uz}
                </span>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Selected Mahalla Pin Marker */}
        {selected && (
          <CircleMarker
            center={[selected.lat, selected.lon]}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 2.5,
              fillColor: '#1d4ed8',
              fillOpacity: 1,
            }}
          />
        )}
      </>
    );
  }, [cells, value, hoveredId, isDark, lang, selected, onChange, emptyBorder, emptyFill]);

  return (
    <div className="space-y-2 text-left">
      <Select
        value={value}
        onChange={onChange}
        placeholder={lang === 'ru' ? 'Выберите махаллю из списка...' : 'Ro\'yxatdan mahallani tanlang...'}
        options={options}
        className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm ${error ? 'ring-2 ring-gov-danger/40' : ''}`}
      />

      <div className={`relative rounded-xl overflow-hidden border border-gov-border shadow-inner ${error ? 'ring-2 ring-gov-danger/40' : ''}`}>
        <MahallaMap
          height="240px"
          scrollWheelZoom={false}
          overlayLayers={overlayLayers}
          focusLocation={selected ? { lat: selected.lat, lon: selected.lon, zoom: 14 } : null}
        />

        {/* Floating helper chip on top right of map */}
        <div className="absolute top-2 right-2 z-[400] pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gov-surface/90 backdrop-blur-sm border border-gov-border shadow-sm text-[10px] font-semibold text-gov-muted">
            <MapIcon className="h-3 w-3 text-gov-primary" />
            {lang === 'ru' ? 'Интерактивная карта' : 'Interaktiv xarita'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between p-2 rounded-lg bg-gov-light/60 border border-gov-border text-xs min-h-[36px]">
        {selected ? (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-gov-primary shrink-0 animate-pulse" />
              <span className="font-bold text-gov-primary truncate">
                {lang === 'ru' ? selected.name_ru : selected.name_uz}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[11px] font-semibold text-gov-muted hover:text-gov-danger inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors shrink-0 ml-2"
              title={lang === 'ru' ? 'Сбросить выбор' : 'Tanlovni bekor qilish'}
            >
              <CloseIcon className="h-3 w-3" />
              <span>{lang === 'ru' ? 'Сбросить' : 'Bekor qilish'}</span>
            </button>
          </>
        ) : (
          <span className="text-[11px] text-gov-muted flex items-center gap-1.5">
            <MapIcon className="h-3.5 w-3.5 opacity-60 shrink-0" />
            {lang === 'ru' ? 'Нажмите на сектор на карте или выберите из списка' : 'Xaritadan sektorni bosing yoki ro\'yxatdan tanlang'}
          </span>
        )}
      </div>
    </div>
  );
}

export default MahallaPicker;
