import React from 'react';
import MahallaMap from './MahallaMap';
import { OLMAZOR_MAHALLAS } from '../../data/olmazorMahallas';

// Compact click-to-select mahalla picker for the registration form — real Olmazor
// tumani pins (see MahallaMap), scroll-wheel zoom off so it doesn't hijack page scroll.
function MahallaPicker({ value, onChange, lang, error }) {
  const selected = value ? OLMAZOR_MAHALLAS.find(m => m.id === value) : null;

  const getMarkerProps = (mahalla) => {
    const isSelected = mahalla.id === value;
    return {
      radius: isSelected ? 9 : 5,
      color: isSelected ? '#0d366b' : '#2a78d6',
      weight: isSelected ? 3 : 1,
      fillColor: isSelected ? '#2a78d6' : '#9ec5f4',
      fillOpacity: isSelected ? 0.95 : 0.6,
      opacity: 1,
      tooltip: lang === 'ru' ? mahalla.name_ru : mahalla.name_uz,
    };
  };

  return (
    <div>
      <MahallaMap
        height="220px"
        scrollWheelZoom={false}
        getMarkerProps={getMarkerProps}
        onMarkerClick={(m) => onChange(m.id)}
        className={error ? 'ring-2 ring-gov-danger/40' : ''}
      />
      <p className="text-xs mt-1.5 text-left">
        {selected ? (
          <span className="font-semibold text-gov-primary">
            {lang === 'ru' ? selected.name_ru : selected.name_uz}
          </span>
        ) : (
          <span className="text-gov-muted">
            {lang === 'ru' ? 'Махалля не выбрана — нажмите на карту' : 'Mahalla tanlanmagan — xaritani bosing'}
          </span>
        )}
      </p>
    </div>
  );
}

export default MahallaPicker;
