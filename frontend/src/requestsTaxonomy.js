// Taxonomy for the Zapros / Ekspertiza / Ta'qiq registries — mirrors the
// backend's `type` / `status` choices on CaseRequest, Ekspertiza and Taqiq.

export const ZAPROS_TYPES = [
  { value: 'gai', ru: 'ГАИ (БДДА)', uz: "YHXB (GAI)" },
  { value: 'notarius', ru: 'Нотариус', uz: 'Notarius' },
  { value: 'kadastr', ru: 'Кадастр', uz: 'Kadastr' },
  { value: 'soliq', ru: 'Налоговая служба', uz: 'Soliq' },
];

export const ZAPROS_STATUSES = [
  { value: 'yuborilgan', ru: 'Отправлен', uz: 'Yuborilgan' },
  { value: 'javob_kelgan', ru: 'Ответ получен', uz: 'Javob kelgan' },
  { value: 'rad_etilgan', ru: 'Отклонён', uz: 'Rad etilgan' },
];

export const EKSPERTIZA_TYPES = [
  { value: 'sud_tibbiy', ru: 'Судебно-медицинская экспертиза', uz: 'Sud-tibbiy ekspertiza' },
  { value: 'sud_biologik', ru: 'Судебно-биологическая экспертиза', uz: 'Sud-biologik ekspertiza' },
  { value: 'sud_xatshunoslik', ru: 'Судебно-почерковедческая экспертиза', uz: 'Sud xatshunoslik ekspertiza' },
  { value: 'sud_texnik', ru: 'Судебно-техническая экспертиза', uz: 'Sud-texnik ekspertiza' },
  { value: 'sud_dnk', ru: 'Судебная ДНК-экспертиза', uz: 'Sudga oid DNK ekspertiza' },
];

export const EKSPERTIZA_STATUSES = [
  { value: 'tayinlangan', ru: 'Назначена', uz: 'Tayinlangan' },
  { value: 'jarayonda', ru: 'В процессе', uz: 'Jarayonda' },
  { value: 'yakunlangan', ru: 'Завершена', uz: 'Yakunlangan' },
];

export const TAQIQ_TYPES = [
  { value: 'mashina', ru: 'Автомашина', uz: 'Mashina' },
  { value: 'mol_mulk', ru: 'Имущество', uz: 'Mol-mulk' },
  { value: 'uy_joy', ru: 'Жилое помещение', uz: 'Uy-joy' },
];

export const TAQIQ_STATUSES = [
  { value: 'amalda', ru: 'Действует', uz: 'Amalda' },
  { value: 'bekor_qilingan', ru: 'Снят', uz: "Bekor qilingan" },
];

export function findLabel(list, value, lang) {
  const found = list.find(o => o.value === value);
  return found ? (lang === 'ru' ? found.ru : found.uz) : value;
}
