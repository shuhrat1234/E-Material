import React, { useMemo } from 'react';
import MahallaMap from './MahallaMap';
import Select from './Select';
import { OLMAZOR_MAHALLAS } from '../../data/olmazorMahallas';

// Compact click-to-select mahalla picker for the registration form — real Olmazor
// tumani pins (see MahallaMap), scroll-wheel zoom off so it doesn't hijack page scroll.
// A dropdown is offered alongside the map since precisely tapping a small pin isn't
// always practical — both control the same value, so either one works.
function MahallaPicker({ value, onChange, lang, error }) {
  const selected = value ? OLMAZOR_MAHALLAS.find(m => m.id === value) : null;

  const options = useMemo(
    () => [...OLMAZOR_MAHALLAS]
      .sort((a, b) => (lang === 'ru' ? a.name_ru.localeCompare(b.name_ru) : a.name_uz.localeCompare(b.name_uz)))
      .map(m => ({ value: m.id, label: lang === 'ru' ? m.name_ru : m.name_uz })),
    [lang]
  );

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
      <Select
        value={value}
        onChange={onChange}
        placeholder={lang === 'ru' ? 'Выберите махаллю из списка...' : 'Ro\'yxatdan mahallani tanlang...'}
        options={options}
        className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm mb-2 ${error ? 'ring-2 ring-gov-danger/40' : ''}`}
      />
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
            {lang === 'ru' ? 'Махалля не выбрана — выберите из списка или нажмите на карту' : 'Mahalla tanlanmagan — ro\'yxatdan tanlang yoki xaritani bosing'}
          </span>
        )}
      </p>
    </div>
  );
}

export default MahallaPicker;
