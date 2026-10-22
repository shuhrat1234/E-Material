import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE, TRANSLATIONS } from '../App';
import { SearchIcon, CloseIcon, DocumentIcon } from './Icons';
import DocumentPreviewModal from './DocumentPreviewModal';

const STATUS_LABELS = {
  'изучаемый': { ru: 'Изучаемый', uz: 'O\'rganilmoqda', tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  'закрыт_в_срок': { ru: 'Закрыт в срок', uz: 'Muddatida yopildi', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'срок_приближается': { ru: 'Срок приближается', uz: 'Yaqinlashmoqda', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  'срок_нарушен': { ru: 'Срок нарушен', uz: 'Muddati buzilgan', tone: 'bg-rose-50 text-rose-700 border-rose-100' },
};

// Public, no-login page: a citizen tracks their own material with just its ID and
// the phone number they registered with. Reached at /arizalarim, independent of the
// normal login flow — see App.jsx's manual route check.
function MaterialStatusPage({ lang, setLang, onBack, initialMaterialId = '' }) {
  const [materialId, setMaterialId] = useState(initialMaterialId);
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (initialMaterialId) {
      setLoading(true);
      setError('');
      axios.post(`${API_BASE}/public/check-status/`, {
        material_id: initialMaterialId.trim(),
        qr: true,
      })
        .then(res => {
          setLoading(false);
          setResult(res.data);
        })
        .catch(() => {
          setLoading(false);
          setError(
            lang === 'ru'
              ? 'Материал не найден. Проверьте ID.'
              : 'Material topilmadi. ID raqamini tekshiring.'
          );
        });
    }
  }, [initialMaterialId, lang]);

  const handleCheckStatus = (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!materialId.trim()) {
      setError(lang === 'ru' ? 'Укажите ID материала' : 'Material ID raqamini kiriting');
      return;
    }
    setLoading(true);
    axios.post(`${API_BASE}/public/check-status/`, {
      material_id: materialId.trim(),
      phone: phone.trim(),
      qr: !phone.trim(),
    })
      .then(res => {
        setLoading(false);
        setResult(res.data);
      })
      .catch(() => {
        setLoading(false);
        setError(
          lang === 'ru'
            ? 'Материал не найден. Проверьте ID и номер телефона.'
            : 'Material topilmadi. ID va telefon raqamini tekshiring.'
        );
      });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 20%, rgba(37,99,235,0.07), transparent 40%), radial-gradient(circle at 85% 80%, rgba(37,99,235,0.06), transparent 40%)',
      }}
    >
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/emblem.png" alt="" className="h-20 w-20 object-contain mb-3" />
          <p className="text-sm text-gov-text font-extrabold uppercase leading-snug">
            {t.subtitle}
          </p>
        </div>

        <div className="bg-gov-surface rounded-2xl shadow-pop p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gov-text flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-gov-primary" />
              {lang === 'ru' ? 'Проверка статуса материала' : 'Material holatini tekshirish'}
            </h3>
            <button
              type="button"
              onClick={onBack}
              className="p-1 -m-1 text-gov-muted hover:text-gov-text rounded hover:bg-gov-light transition-colors"
              title={lang === 'ru' ? 'Назад к входу' : 'Kirishga qaytish'}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-gov-danger text-xs rounded-xl text-left font-medium">
              {error}
            </div>
          )}

          {!result ? (
            <form className="space-y-4" onSubmit={handleCheckStatus}>
              <div>
                <label className="block text-xs font-semibold text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'ID материала' : 'Material ID'}
                </label>
                <input
                  type="text"
                  value={materialId}
                  placeholder="MAT-2026-0037"
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Ваш телефон (указанный при обращении)' : 'Telefon raqamingiz (murojaatda ko\'rsatilgan)'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  placeholder="+998 90 123-45-67"
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-3.5 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl bg-gov-primary text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
              >
                {loading ? (lang === 'ru' ? 'Проверка...' : 'Tekshirilmoqda...') : (lang === 'ru' ? 'Проверить' : 'Tekshirish')}
              </button>
            </form>
          ) : (
            <div className="space-y-3 text-left">
              {/* Verified seal */}
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">✓</span>
                <div>
                  <p className="font-bold text-[11px] leading-tight">
                    {lang === 'ru' ? 'Официально подтвержденный материал' : 'Rasmiy tasdiqlangan material'}
                  </p>
                  <p className="text-[10px] text-emerald-700/80 mt-0.5">
                    {lang === 'ru' ? 'Электронная подпись и QR-верификация действительны' : 'Elektron raqamli imzo va QR-verifikatsiya tasdiqlangan'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-navy font-mono">{result.id}</span>
                <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold ${STATUS_LABELS[result.status]?.tone || 'bg-gray-50 text-gray-700 border-gov-border'}`}>
                  {STATUS_LABELS[result.status] ? STATUS_LABELS[result.status][lang] : result.status}
                </span>
              </div>

              {/* Case Title */}
              {(result.title_uz || result.title_ru) && (
                <div className="p-3 bg-gov-light/60 border border-gov-border rounded-xl text-xs">
                  <p className="text-[9px] font-bold text-gov-muted uppercase tracking-wider mb-1">
                    {lang === 'ru' ? 'Содержание / Решение' : 'Mazmuni / Qaror'}
                  </p>
                  <p className="font-semibold text-gov-text leading-snug">
                    {lang === 'ru' ? (result.title_ru || result.title_uz) : (result.title_uz || result.title_ru)}
                  </p>
                </div>
              )}

              {/* Citizen */}
              {result.citizen_name && (
                <div className="p-3 bg-gov-light/60 border border-gov-border rounded-xl text-xs">
                  <p className="text-[9px] font-bold text-gov-muted uppercase tracking-wider mb-0.5">
                    {lang === 'ru' ? 'Заявитель (гражданин)' : 'Murojaatchi (fuqaro)'}
                  </p>
                  <p className="font-bold text-gov-navy">{result.citizen_name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="border border-gov-border rounded-lg p-2.5 bg-gov-light/45">
                  <p className="text-[9px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Зарегистрировано' : 'Ro\'yxatga olindi'}</p>
                  <p className="font-semibold text-gov-text mt-0.5">{formatDate(result.registered_at)}</p>
                </div>
                <div className="border border-gov-border rounded-lg p-2.5 bg-gov-light/45">
                  <p className="text-[9px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Срок' : 'Muddat'}</p>
                  <p className="font-semibold text-gov-text mt-0.5">{formatDate(result.deadline)}</p>
                </div>
              </div>

              {result.officer_name_ru && (
                <div className="border border-gov-border rounded-lg p-2.5 bg-gov-light/45 text-xs">
                  <p className="text-[9px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Исполнитель' : 'Ijrochi'}</p>
                  <p className="font-semibold text-gov-text mt-0.5">
                    {lang === 'ru' ? result.officer_rank_ru : result.officer_rank_uz} {lang === 'ru' ? result.officer_name_ru : result.officer_name_uz}
                  </p>
                  {result.officer_phone && (
                    <p className="text-gov-primary font-semibold mt-1">{result.officer_phone}</p>
                  )}
                </div>
              )}

              {/* Documents list */}
              {result.documents && result.documents.length > 0 && (
                <div className="border border-gov-border rounded-xl p-3 bg-gov-light/30">
                  <p className="text-[10px] font-bold text-gov-navy uppercase tracking-wider mb-2">
                    {lang === 'ru' ? 'Прикрепленные документы с QR-кодом' : 'Biriktirilgan QR-kodli rasmiy hujjatlar'}
                  </p>
                  <div className="space-y-1.5">
                    {result.documents.map(d => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gov-surface border border-gov-border hover:border-gov-primary/50 transition-colors text-xs font-semibold text-gov-primary"
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(d)}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left text-gov-navy font-semibold truncate hover:text-gov-primary cursor-pointer"
                          title={d.original_name}
                        >
                          <DocumentIcon className="h-4 w-4 text-gov-primary shrink-0" />
                          <span className="truncate">{d.original_name}</span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(d)}
                            className="text-[10px] px-2 py-1 rounded bg-gov-light hover:bg-gov-primaryLight text-gov-primary font-semibold transition-colors cursor-pointer"
                          >
                            {lang === 'ru' ? 'Просмотр' : 'Ko‘rish'}
                          </button>
                          <a
                            href={d.file_url ? d.file_url.replace(/^http:\/\//, 'https://') : ''}
                            download={d.original_name || 'hujjat.docx'}
                            className="text-[10px] px-2 py-1 rounded bg-gov-primary text-white font-semibold hover:bg-gov-primaryDark transition-colors"
                          >
                            {lang === 'ru' ? 'Скачать' : 'Yuklab olish'}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setResult(null); setMaterialId(''); setPhone(''); }}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl border border-gov-border text-gov-text hover:bg-gov-light transition-colors"
              >
                {lang === 'ru' ? 'Проверить другой материал' : 'Boshqa materialni tekshirish'}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onBack}
            className="w-full text-xs font-semibold text-gov-muted hover:text-gov-primary transition-colors"
          >
            {lang === 'ru' ? '← Назад к входу' : '← Kirishga qaytish'}
          </button>
        </div>

        <div className="flex justify-center mt-6">
          <div className="flex bg-gov-surface shadow-card p-1 rounded-full text-xs font-semibold">
            <button
              onClick={() => setLang('ru')}
              className={`px-4 py-1.5 rounded-full transition-colors ${lang === 'ru' ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-muted hover:text-gov-text'}`}
            >
              РУССКИЙ
            </button>
            <button
              onClick={() => setLang('uz')}
              className={`px-4 py-1.5 rounded-full transition-colors ${lang === 'uz' ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-muted hover:text-gov-text'}`}
            >
              O'ZBEKCHA
            </button>
          </div>
        </div>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          lang={lang}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

export default MaterialStatusPage;
