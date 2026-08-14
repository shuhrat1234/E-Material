import React, { useMemo, useState } from 'react';
import MahallaMap from './ui/MahallaMap';
import Card, { CardHeader } from './ui/Card';
import { MapIcon } from './Icons';
import { SEQUENTIAL } from '../chartColors';
import { useSettings } from '../settingsContext';
import { MATERIAL_TYPES } from '../materialTaxonomy';
import { OLMAZOR_MAHALLAS } from '../data/olmazorMahallas';

// Proportional-symbol (bubble) map, not a choropleth: OpenStreetMap only has real
// polygon shapes for a fraction of Olmazor's mahallas, so every mahalla is a pin
// sized/colored by case count instead — see plan notes on data availability.
function CrimeMapPanel({ materials, lang, onOpenMaterialsList }) {
  const { isDark } = useSettings();
  const [selectedId, setSelectedId] = useState(null);
  const mutedHex = isDark ? '#94a3b8' : '#64748b';

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

  const getMarkerProps = (mahalla) => {
    const count = (byMahalla[mahalla.id] || []).length;
    const isSelected = mahalla.id === selectedId;
    const name = lang === 'ru' ? mahalla.name_ru : mahalla.name_uz;

    if (count === 0) {
      return {
        radius: isSelected ? 7 : 5,
        color: isSelected ? SEQUENTIAL[3] : mutedHex,
        weight: isSelected ? 2 : 1,
        fillColor: mutedHex,
        fillOpacity: 0.25,
        opacity: 0.7,
        tooltip: `${name}: 0`,
      };
    }

    const ratio = count / maxCount;
    const bucket = Math.min(SEQUENTIAL.length - 1, Math.floor(ratio * (SEQUENTIAL.length - 1)));
    return {
      radius: 7 + Math.sqrt(ratio) * 14,
      color: isSelected ? '#0d366b' : SEQUENTIAL[SEQUENTIAL.length - 1],
      weight: isSelected ? 3 : 1,
      fillColor: SEQUENTIAL[bucket],
      fillOpacity: 0.85,
      opacity: 1,
      tooltip: `${name}: ${count}`,
    };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="flex-1 w-full min-w-0">
        <MahallaMap
          height="520px"
          getMarkerProps={getMarkerProps}
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
