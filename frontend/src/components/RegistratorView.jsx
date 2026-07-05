import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, TRANSLATIONS } from '../App';
import ChatPanel from './ChatPanel';
import { ChatIcon, EyeIcon } from './Icons';
import Select from './ui/Select';
import ExportButton from './ui/ExportButton';
import { exportToCsv } from '../exportCsv';
import { notify } from '../toastService';

function RegistratorView({ lang, onViewDetails, user }) {
  const [activeTab, setActiveTab] = useState('register'); // register, approvals
  const [officers, setOfficers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  // Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [titleUz, setTitleUz] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('10');
  const [difficulty, setDifficulty] = useState(3);
  const [materialType, setMaterialType] = useState('ariza');
  const [sourceFrom, setSourceFrom] = useState('tashrif');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const investigators = officers.filter(o => o.role === 'investigator');

  const validate = () => {
    const next = {};
    if (citizenName.trim().length < 3) {
      next.citizenName = lang === 'ru' ? 'Укажите ФИО заявителя (минимум 3 символа)' : 'Murojaatchi F.I.Sh.ni kiriting (kamida 3 belgi)';
    }
    const phoneDigits = citizenPhone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      next.citizenPhone = lang === 'ru' ? 'Введите корректный номер телефона' : 'Telefon raqamini to\'g\'ri kiriting';
    }
    if (!titleRu.trim()) {
      next.titleRu = lang === 'ru' ? 'Заполните содержание на русском' : 'Rus tilida mazmunni kiriting';
    }
    if (!titleUz.trim()) {
      next.titleUz = lang === 'ru' ? 'Заполните содержание на узбекском' : 'O\'zbek tilida mazmunni kiriting';
    }
    if (!officerId) {
      next.officerId = lang === 'ru' ? 'Выберите исполнителя' : 'Ijrochini tanlang';
    }
    const days = parseInt(deadlineDays, 10);
    if (!Number.isFinite(days) || days < 1 || days > 90) {
      next.deadlineDays = lang === 'ru' ? 'Срок должен быть от 1 до 90 дней' : 'Muddat 1 dan 90 kungacha bo\'lishi kerak';
    }
    return next;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = () => {
    axios.get(`${API_BASE}/officers/`)
      .then(res => {
        setOfficers(res.data);
        if (res.data.length > 0) setOfficerId(res.data[0].id);
      });
    
    axios.get(`${API_BASE}/materials/`)
      .then(res => {
        // Sort newest first
        setMaterials(res.data.reverse());
      });

    axios.get(`${API_BASE}/approvals/`)
      .then(res => {
        setApprovalRequests(res.data);
      });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      citizen_name: citizenName.trim(),
      citizen_phone: citizenPhone.trim(),
      title_ru: titleRu.trim(),
      title_uz: titleUz.trim(),
      officer: officerId,
      deadline_days: parseInt(deadlineDays, 10),
      difficulty,
      material_type: materialType,
      source_from: sourceFrom
    };

    setSubmitting(true);
    axios.post(`${API_BASE}/materials/`, payload)
      .then(() => {
        notify(lang === 'ru' ? 'Материал успешно зарегистрирован!' : 'Material muvaffaqiyatli ro\'yxatdan o\'tkazildi!', 'success');
        // Reset form
        setCitizenName('');
        setCitizenPhone('');
        setTitleRu('');
        setTitleUz('');
        setDeadlineDays('10');
        setDifficulty(3);
        setMaterialType('ariza');
        setSourceFrom('tashrif');
        setErrors({});
        setSubmitting(false);
        fetchInitialData();
      })
      .catch(err => {
        console.error("Error creating material", err);
        notify(lang === 'ru' ? 'Ошибка при создании материала' : 'Materialni yaratishda xatolik yuz berdi', 'error');
        setSubmitting(false);
      });
  };

  const handleApprove = (caseId) => {
    axios.post(`${API_BASE}/approvals/${caseId}/approve/`)
      .then(() => {
        notify(lang === 'ru' ? 'Решение успешно утверждено!' : 'Qaror muvaffaqiyatli tasdiqlandi!', 'success');
        fetchInitialData();
      })
      .catch(err => console.error(err));
  };

  const handleReject = (caseId) => {
    axios.post(`${API_BASE}/approvals/${caseId}/reject/`)
      .then(() => {
        notify(lang === 'ru' ? 'Решение отклонено!' : 'Qaror rad etildi!', 'info');
        fetchInitialData();
      })
      .catch(err => console.error(err));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'изучаемый':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'закрыт_в_срок':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'срок_приближается':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'срок_нарушен':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gov-border';
    }
  };

  const getStatusText = (status) => {
    const map = {
      'изучаемый': lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda',
      'закрыт_в_срок': lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi',
      'срок_приближается': lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda',
      'срок_нарушен': lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan',
    };
    return map[status] || status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleExportRegistry = () => {
    exportToCsv(
      lang === 'ru' ? 'reestr_materialov' : 'materiallar_reyestri',
      ['ID', lang === 'ru' ? 'Заявитель' : 'Murojaatchi', lang === 'ru' ? 'Телефон' : 'Telefon', lang === 'ru' ? 'Исполнитель' : 'Ijrochi', lang === 'ru' ? 'Содержание' : 'Mazmuni', lang === 'ru' ? 'Срок' : 'Muddat', lang === 'ru' ? 'Статус' : 'Holat'],
      materials.map(m => {
        const off = officers.find(o => o.id === m.officer);
        return [
          m.id,
          m.citizen_name,
          m.citizen_phone,
          off ? (lang === 'ru' ? off.name_ru : off.name_uz) : '',
          lang === 'ru' ? m.title_ru : m.title_uz,
          formatDate(m.deadline),
          getStatusText(m.status),
        ];
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-white shadow-card p-1.5 rounded-full w-fit gap-1">
        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'register' ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-muted hover:text-gov-text'
          }`}
        >
          {lang === 'ru' ? 'Регистрация материалов' : 'Materiallarni ro\'yxatga olish'}
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'approvals' ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-muted hover:text-gov-text'
          }`}
        >
          {lang === 'ru' ? 'Тасдиклаш сурови' : 'Tasdiqlash so\'rovlari'}
          {approvalRequests.length > 0 && (
            <span className="w-5 h-5 bg-gov-danger text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {approvalRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'chat' ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-muted hover:text-gov-text'
          }`}
        >
          <ChatIcon className="h-3.5 w-3.5" /> {lang === 'ru' ? 'Чат' : 'Chat'}
        </button>
      </div>

      {activeTab === 'chat' ? (
        <ChatPanel lang={lang} user={user} />
      ) : activeTab === 'register' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Left */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-card p-6 space-y-4">
            <h3 className="font-semibold text-sm text-gov-text border-b border-gov-border pb-3">
              {lang === 'ru' ? 'Регистрация нового материала' : 'Yangi materialni ro\'yxatdan o\'tkazish'}
            </h3>
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Ф.И.О. Заявителя' : 'Murojaatchining F.I.Sh.'}
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className={`block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${errors.citizenName ? 'ring-2 ring-gov-danger/40' : ''}`}
                />
                {errors.citizenName && <p className="text-[11px] text-gov-danger mt-1">{errors.citizenName}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Телефон заявителя' : 'Telefon raqami'}
                </label>
                <input
                  type="tel"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  placeholder="+998 90 123-45-67"
                  className={`block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${errors.citizenPhone ? 'ring-2 ring-gov-danger/40' : ''}`}
                />
                {errors.citizenPhone && <p className="text-[11px] text-gov-danger mt-1">{errors.citizenPhone}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Содержание обращения (на русском)' : 'Murojaat mazmuni (rus tilida)'}
                </label>
                <textarea
                  rows={2}
                  value={titleRu}
                  onChange={(e) => setTitleRu(e.target.value)}
                  placeholder="Заявление о краже..."
                  className={`block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all resize-none ${errors.titleRu ? 'ring-2 ring-gov-danger/40' : ''}`}
                />
                {errors.titleRu && <p className="text-[11px] text-gov-danger mt-1">{errors.titleRu}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Содержание обращения (на узбекском)' : 'Murojaat mazmuni (o\'zbek tilida)'}
                </label>
                <textarea
                  rows={2}
                  value={titleUz}
                  onChange={(e) => setTitleUz(e.target.value)}
                  placeholder="Ariza..."
                  className={`block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all resize-none ${errors.titleUz ? 'ring-2 ring-gov-danger/40' : ''}`}
                />
                {errors.titleUz && <p className="text-[11px] text-gov-danger mt-1">{errors.titleUz}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Исполнитель / Сотрудник' : 'Mas\'ul xodim'}
                </label>
                <Select
                  value={officerId}
                  onChange={setOfficerId}
                  disabled={investigators.length === 0}
                  placeholder={lang === 'ru' ? 'Выберите следователя' : 'Tergovchini tanlang'}
                  className={`block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm ${errors.officerId ? 'ring-2 ring-gov-danger/40' : ''}`}
                  options={investigators.map(o => ({
                    value: o.id,
                    label: `${lang === 'ru' ? o.rank_ru : o.rank_uz} ${lang === 'ru' ? o.name_ru : o.name_uz}`
                  }))}
                />
                {errors.officerId && <p className="text-[11px] text-gov-danger mt-1">{errors.officerId}</p>}
                {investigators.length === 0 && (
                  <p className="text-[11px] text-gov-warning mt-1">
                    {lang === 'ru' ? 'Нет доступных следователей для назначения' : 'Biriktirish uchun tergovchilar mavjud emas'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                    {lang === 'ru' ? 'Срок (дней)' : 'Muddat (kun)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                    className={`block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${errors.deadlineDays ? 'ring-2 ring-gov-danger/40' : ''}`}
                  />
                  {errors.deadlineDays && <p className="text-[11px] text-gov-danger mt-1">{errors.deadlineDays}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                    {lang === 'ru' ? 'Сложность' : 'Murakkablik'}
                  </label>
                  <Select
                    value={difficulty}
                    onChange={setDifficulty}
                    className="block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm"
                    options={[
                      { value: '1', label: '1 — Низкая' },
                      { value: '2', label: '2' },
                      { value: '3', label: '3 — Средняя' },
                      { value: '4', label: '4' },
                      { value: '5', label: '5 — Высокая' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                    {lang === 'ru' ? 'Тип материала' : 'Hujjat turi'}
                  </label>
                  <Select
                    value={materialType}
                    onChange={setMaterialType}
                    className="block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm"
                    options={[
                      { value: 'ariza', label: lang === 'ru' ? 'Заявление (Ариза)' : 'Ariza' },
                      { value: 'bildirgi', label: lang === 'ru' ? 'Рапорт (Билдирги)' : 'Bildirgi' },
                      { value: 'sud_ajrimi', label: lang === 'ru' ? 'Определение суда' : 'Sud ajrimi' },
                      { value: 'boshqa', label: lang === 'ru' ? 'Другое' : 'Boshqa' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                    {lang === 'ru' ? 'Источник' : 'Manba'}
                  </label>
                  <Select
                    value={sourceFrom}
                    onChange={setSourceFrom}
                    className="block w-full px-3 py-2.5 rounded-xl bg-gov-light text-sm"
                    options={[
                      { value: 'tashrif', label: lang === 'ru' ? 'При посещении (Тамбур)' : 'Tashrif orqali' },
                      { value: 'prakuratura', label: lang === 'ru' ? 'Прокуратура' : 'Prokuratura' },
                      { value: 'prezident_aparat', label: lang === 'ru' ? 'Аппарат Президента' : 'Prezident apparati' },
                      { value: 'iio', label: lang === 'ru' ? 'Другой ИИО' : 'Boshqa IIO' },
                      { value: 'portal', label: lang === 'ru' ? 'Портал' : 'Portal' },
                    ]}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || investigators.length === 0}
                className="w-full py-3 bg-gov-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-2 disabled:opacity-50"
              >
                {submitting ? (lang === 'ru' ? 'Регистрация...' : 'Ro\'yxatga olinmoqda...') : (lang === 'ru' ? 'Зарегистрировать' : 'Ro\'yxatga olish')}
              </button>
            </form>
          </div>

          {/* Table Registry Right */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-4">
              <h3 className="font-semibold text-sm text-gov-text text-left">
                {lang === 'ru' ? 'Реестр зарегистрированных материалов' : 'Ro\'yxatga olingan materiallar reyestri'}
              </h3>
              <ExportButton lang={lang} onClick={handleExportRegistry} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Заявитель' : 'Murojaatchi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Исполнитель' : 'Ijrochi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Содержание' : 'Mazmuni'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Срок' : 'Muddat'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Статус' : 'Status'}</th>
                    <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Просмотр' : 'Ko\'rish'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {materials.map(m => {
                    const officer = officers.find(o => o.id === m.officer);
                    const officerName = officer ? (lang === 'ru' ? officer.name_ru.split(' ')[0] + ' ' + officer.name_ru.split(' ')[1][0] + '.' : officer.name_uz.split(' ')[0]) : '';
                    return (
                      <tr key={m.id} className="hover:bg-gov-light/30">
                        <td className="px-4 py-3 font-semibold text-gov-text">{m.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gov-text">{m.citizen_name}</p>
                          <p className="text-[10px] text-gov-muted mt-0.5">{m.citizen_phone}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-gov-muted">{officerName}</td>
                        <td className="px-4 py-3 text-gov-muted max-w-[150px] truncate" title={lang === 'ru' ? m.title_ru : m.title_uz}>
                          {lang === 'ru' ? m.title_ru : m.title_uz}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gov-text">{formatDate(m.deadline)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none ${getStatusClass(m.status)}`}>
                            {getStatusText(m.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onViewDetails(m.id)}
                            className="p-1.5 bg-gov-light border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors inline-flex"
                            title="Details"
                          >
                            <EyeIcon />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Approvals Tab */
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
            {lang === 'ru' ? 'Запросы на согласование решений' : 'Qarorlarni tasdiqlash so\'rovlari'}
          </h3>
          
          {approvalRequests.length === 0 ? (
            <div className="text-center py-12 text-gov-muted text-xs font-semibold">
              {lang === 'ru' ? 'Запросов на согласование нет' : 'Tasdiqlash uchun so\'rovlar mavjud emas'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvalRequests.map(req => {
                const material = materials.find(m => m.id === req.case);
                const officer = officers.find(o => o.id === req.officer);
                
                const typeLabel = req.type === 'закрыт_в_срок'
                  ? (lang === 'ru' ? 'Отказ в возбуждении дела' : 'JIQni rad etish')
                  : req.type === 'возбуждено' 
                    ? (lang === 'ru' ? 'Возбуждение уголовного дела' : 'JIQ qo\'zg\'atish') 
                    : (lang === 'ru' ? 'Направление по подследственности' : 'Tergovga yuborish');
                
                return (
                  <div key={req.id} className="rounded-xl p-4 bg-gov-light/60 flex justify-between items-start gap-4 text-left">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gov-primary">{req.case}</span>
                        <span className="text-[10px] font-semibold text-gov-muted bg-white border border-gov-border px-1.5 py-0.5 rounded uppercase">
                          {typeLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-gov-text font-medium">
                        {lang === 'ru' ? 'Исполнитель' : 'Ijrochi'}: <span className="font-semibold">{officer ? officer.name_ru : ''}</span>
                      </p>
                      <p className="text-xs text-gov-muted italic border-l-2 border-gov-border pl-2 mt-1">
                        "{req.reason}"
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApprove(req.case)}
                        className="p-1.5 bg-gov-success text-white hover:bg-teal-700 rounded transition-colors"
                        title="Approve"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReject(req.case)}
                        className="p-1.5 bg-gov-danger text-white hover:bg-rose-700 rounded transition-colors"
                        title="Reject"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RegistratorView;
