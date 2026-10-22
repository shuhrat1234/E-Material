export const DISTRICTS = {
  olmazor: {
    id: 'olmazor',
    path: '/olmazor',
    name_uz: "Olmazor tumani",
    name_ru: "Алмазарский район",
    subtitle_uz: "Olmazor tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi",
    subtitle_ru: "Следственный отдел при УКД ОВД Алмазарского района Отделение доследственной проверки",
    short_title_uz: "Olmazor tuman IIO FMB",
    short_title_ru: "УКД ОВД Алмазарского района",
    badge: "Olmazor",
  },
  yashnobod: {
    id: 'yashnobod',
    path: '/yashnobod',
    name_uz: "Yashnobod tumani",
    name_ru: "Яшнабадский район",
    subtitle_uz: "Yashnobod tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi",
    subtitle_ru: "Следственный отдел при УКД ОВД Яшнабадского района Отделение доследственной проверки",
    short_title_uz: "Yashnobod tuman IIO FMB",
    short_title_ru: "УКД ОВД Яшнабадского района",
    badge: "Yashnobod",
  }
};

export function getActiveDistrictId(pathname = window.location.pathname) {
  if (pathname.startsWith('/olmazor')) {
    return 'olmazor';
  }
  if (pathname.startsWith('/yashnobod')) {
    return 'yashnobod';
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('district') || params.get('dept');
    if (d && DISTRICTS[d]) return d;
  } catch {}
  return 'yashnobod';
}

export function getActiveDistrict(pathname = window.location.pathname) {
  const id = getActiveDistrictId(pathname);
  return DISTRICTS[id];
}
