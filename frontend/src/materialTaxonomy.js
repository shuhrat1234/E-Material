// Single source of truth for "Hujjat turi" (material_type) and its dependent
// "Manba" (source_from) options, since Manba's choices depend on which Hujjat
// turi is selected: E-material has exactly one source, Murojaat has several.

export const MATERIAL_TYPES = [
  { value: 'e_material', ru: 'Э-материал', uz: 'E-material' },
  { value: 'murojaat', ru: 'Обращение', uz: 'Murojaat' },
];

const SOURCES_BY_TYPE = {
  e_material: [
    { value: 'e_material', ru: 'Э-материал', uz: 'E-material' },
  ],
  murojaat: [
    { value: 'prezident_portal', ru: 'Портал Президента', uz: 'Prezident portal' },
    { value: 'iiv_murojat', ru: 'Обращение в ИИВ', uz: 'IIV murojat' },
    { value: 'iibb_murojat', ru: 'Обращение в ИИББ', uz: 'IIBB murojat' },
    { value: 'prakuratura', ru: 'Прокуратура', uz: 'Prakuratura' },
    { value: 'shaxsiy_qabul', ru: 'Личный приём', uz: 'Shaxsiy qabul' },
  ],
};

// All sources across every type, flattened — for filter dropdowns where the
// user hasn't necessarily narrowed down by Hujjat turi first.
export const ALL_SOURCES = [
  ...SOURCES_BY_TYPE.e_material,
  ...SOURCES_BY_TYPE.murojaat,
];

export function getSourceOptions(materialType) {
  return SOURCES_BY_TYPE[materialType] || ALL_SOURCES;
}

export function getMaterialTypeLabel(type, lang) {
  const found = MATERIAL_TYPES.find(t => t.value === type);
  return found ? (lang === 'ru' ? found.ru : found.uz) : type;
}

export function getSourceLabel(source, lang) {
  const found = ALL_SOURCES.find(s => s.value === source);
  return found ? (lang === 'ru' ? found.ru : found.uz) : source;
}
