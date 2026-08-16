import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import Modal from './Modal';
import Select from './ui/Select';
import { CloseIcon, EyeIcon, CheckIcon } from './Icons';
import { notify } from '../toastService';
import { findLabel } from '../requestsTaxonomy';

// Generic list/create/resolve panel shared by the Zapros, Ekspertiza and
// Ta'qiq registries — they're all the same shape server-side (a typed item,
// optionally linked to a Material, opened by an officer, later resolved),
// so a single configurable component covers all three instead of three
// near-duplicate ones.
function RegistryPanel({ lang, officer, materials, apiPath, typeOptions, statusOptions, openStatusValue, labels, icon }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [resolveItem, setResolveItem] = useState(null);

  const [type, setType] = useState(typeOptions[0]?.value || '');
  const [materialId, setMaterialId] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');

  const [responseText, setResponseText] = useState('');
  const [resolveStatus, setResolveStatus] = useState('');

  const fetchItems = () => {
    setLoading(true);
    axios.get(`${API_BASE}/${apiPath}/`)
      .then(res => setItems(res.data))
      .catch(err => console.error(`Failed to load ${apiPath}`, err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [apiPath]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getStatusTone = (statusValue) => {
    if (statusValue === openStatusValue) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (statusValue === 'rad_etilgan') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const resetForm = () => {
    setType(typeOptions[0]?.value || '');
    setMaterialId('');
    setSubject('');
    setDetails('');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    axios.post(`${API_BASE}/${apiPath}/`, {
      type,
      material: materialId || null,
      subject,
      details,
      officer: officer?.id || '',
    })
      .then(() => {
        notify(lang === 'ru' ? 'Успешно добавлено' : "Muvaffaqiyatli qo'shildi", 'success');
        setShowForm(false);
        resetForm();
        fetchItems();
      })
      .catch(err => {
        console.error(err);
        notify(lang === 'ru' ? 'Ошибка при сохранении' : 'Saqlashda xatolik', 'error');
      });
  };

  const openResolve = (item) => {
    setResolveItem(item);
    setResponseText(item.response_text || '');
    setResolveStatus(statusOptions.find(s => s.value !== openStatusValue)?.value || '');
  };

  const handleResolve = (e) => {
    e.preventDefault();
    axios.post(`${API_BASE}/${apiPath}/${resolveItem.id}/resolve/`, {
      response_text: responseText,
      status: resolveStatus,
      user_name: officer ? (lang === 'ru' ? officer.name_ru : officer.name_uz) : '',
    })
      .then(() => {
        notify(lang === 'ru' ? 'Обновлено' : 'Yangilandi', 'success');
        setResolveItem(null);
        fetchItems();
      })
      .catch(err => {
        console.error(err);
        notify(lang === 'ru' ? 'Ошибка при обновлении' : 'Yangilashda xatolik', 'error');
      });
  };

  return (
    <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-6 gap-3 flex-wrap">
        <h3 className="font-semibold text-base text-gov-text text-left flex items-center gap-2">
          {icon} {labels.title}
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gov-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {labels.addButton}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gov-border text-left">
          <thead>
            <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
              <th className="px-4 py-3">{labels.typeColumn}</th>
              <th className="px-4 py-3">{labels.subjectColumn}</th>
              <th className="px-4 py-3">{lang === 'ru' ? 'Материал' : 'Material'}</th>
              <th className="px-4 py-3">{lang === 'ru' ? 'Дата' : 'Sana'}</th>
              <th className="px-4 py-3">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
              <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Действия' : 'Amallar'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-border text-xs">
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gov-muted font-medium">
                  {lang === 'ru' ? 'Записей нет' : "Yozuvlar yo'q"}
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gov-light/30">
                <td className="px-4 py-3 font-semibold text-gov-text">{findLabel(typeOptions, item.type, lang)}</td>
                <td className="px-4 py-3 text-gov-muted max-w-xs truncate" title={item.subject}>{item.subject}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-gov-text">{item.material || '—'}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-gov-text">{formatDate(item.started_at)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none ${getStatusTone(item.status)}`}>
                    {findLabel(statusOptions, item.status, lang)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    {item.status === openStatusValue && (
                      <button
                        onClick={() => openResolve(item)}
                        className="p-1.5 bg-gov-success/15 border border-gov-success/20 text-gov-success rounded hover:bg-gov-success/25 transition-colors inline-flex"
                        title={labels.resolveButton}
                      >
                        <CheckIcon />
                      </button>
                    )}
                    {item.status !== openStatusValue && item.response_text && (
                      <button
                        onClick={() => openResolve(item)}
                        className="p-1.5 bg-gov-border/20 border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors inline-flex"
                        title={lang === 'ru' ? 'Просмотр' : "Ko'rish"}
                      >
                        <EyeIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} maxWidth="max-w-md">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gov-border pb-3">
              <h3 className="font-display font-semibold text-sm text-gov-text uppercase tracking-wider">
                {labels.addButton}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">{labels.typeColumn}</label>
                <Select
                  value={type}
                  onChange={setType}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light"
                  options={typeOptions.map(o => ({ value: o.value, label: lang === 'ru' ? o.ru : o.uz }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  {lang === 'ru' ? 'Связанный материал (необязательно)' : "Bog'liq material (ixtiyoriy)"}
                </label>
                <Select
                  value={materialId}
                  onChange={setMaterialId}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light"
                  options={[
                    { value: '', label: lang === 'ru' ? 'Без привязки' : "Bog'lanmagan" },
                    ...materials.map(m => ({ value: m.id, label: `${m.id} — ${m.citizen_name}` })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">{labels.subjectColumn}</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={labels.subjectPlaceholder}
                  className="w-full text-xs p-2 border border-gov-border rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">{labels.detailsColumn}</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder={labels.detailsPlaceholder}
                  className="w-full text-xs p-2 border border-gov-border rounded resize-none focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gov-border">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gov-border text-gov-text text-xs rounded hover:bg-gov-light">
                  {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button type="submit" className="px-4 py-2 bg-gov-primary text-white text-xs font-semibold rounded hover:bg-blue-700 border border-transparent">
                  {lang === 'ru' ? 'Сохранить' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {resolveItem && (
        <Modal onClose={() => setResolveItem(null)} maxWidth="max-w-md">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gov-border pb-3">
              <h3 className="font-display font-semibold text-sm text-gov-text uppercase tracking-wider">
                {labels.resolveButton}
              </h3>
              <button onClick={() => setResolveItem(null)} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  {lang === 'ru' ? 'Статус' : 'Holat'}
                </label>
                <Select
                  value={resolveStatus}
                  onChange={setResolveStatus}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light"
                  options={statusOptions.map(o => ({ value: o.value, label: lang === 'ru' ? o.ru : o.uz }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">{labels.responseColumn}</label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder={labels.responsePlaceholder}
                  className="w-full text-xs p-2 border border-gov-border rounded resize-none focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gov-border">
                <button type="button" onClick={() => setResolveItem(null)} className="px-4 py-2 border border-gov-border text-gov-text text-xs rounded hover:bg-gov-light">
                  {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button type="submit" className="px-4 py-2 bg-gov-primary text-white text-xs font-semibold rounded hover:bg-blue-700 border border-transparent">
                  {lang === 'ru' ? 'Сохранить' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default RegistryPanel;
