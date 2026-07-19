import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, TRANSLATIONS } from '../App';
import ChatPanel from './ChatPanel';
import { ChatIcon, EyeIcon, SearchIcon, ClockIcon, DashboardIcon, UsersIcon, CloseIcon, TrashIcon } from './Icons';
import Select from './ui/Select';
import FilterPill from './ui/FilterPill';
import ExportButton from './ui/ExportButton';
import { exportToExcel } from '../exportExcel';
import { notify } from '../toastService';
import { confirm } from '../confirmService';
import { MATERIAL_TYPES, getSourceOptions } from '../materialTaxonomy';

const MONTH_NAMES_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTH_NAMES_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function RegistratorView({ lang, onViewDetails, user }) {
  const [activeTab, setActiveTab] = useState('register'); // register, approvals
  const [officers, setOfficers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  // Registry filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [registryPage, setRegistryPage] = useState(1);
  const REGISTRY_PAGE_SIZE = 20;

  // Form State
  const [materialId, setMaterialId] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [titleUz, setTitleUz] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('10');
  const [difficulty, setDifficulty] = useState(3);
  const [materialType, setMaterialType] = useState('e_material');
  const [sourceFrom, setSourceFrom] = useState('e_material');
  const [iib, setIib] = useState('');
  const [preliminaryArticle, setPreliminaryArticle] = useState('');
  const [extraIds, setExtraIds] = useState([]); // array of extra ID strings, one input per entry
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const investigators = officers.filter(o => o.role === 'investigator');

  const validate = () => {
    const next = {};
    if (!materialId.trim()) {
      next.materialId = lang === 'ru' ? 'Укажите ID материала' : 'Material ID sini kiriting';
    }
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
      id: materialId.trim(),
      citizen_name: citizenName.trim(),
      citizen_phone: citizenPhone.trim(),
      title_ru: titleRu.trim(),
      title_uz: titleUz.trim(),
      officer: officerId,
      deadline_days: parseInt(deadlineDays, 10),
      difficulty,
      material_type: materialType,
      source_from: sourceFrom,
      iib: iib.trim(),
      preliminary_article: preliminaryArticle.trim(),
      extra_ids: extraIds.map(v => v.trim()).filter(Boolean).join(', '),
    };

    setSubmitting(true);
    axios.post(`${API_BASE}/materials/`, payload)
      .then(() => {
        notify(lang === 'ru' ? 'Материал успешно зарегистрирован!' : 'Material muvaffaqiyatli ro\'yxatdan o\'tkazildi!', 'success');
        // Reset form
        setMaterialId('');
        setCitizenName('');
        setCitizenPhone('');
        setTitleRu('');
        setTitleUz('');
        setDeadlineDays('10');
        setDifficulty(3);
        setMaterialType('e_material');
        setSourceFrom('e_material');
        setIib('');
        setPreliminaryArticle('');
        setExtraIds([]);
        setErrors({});
        setSubmitting(false);
        fetchInitialData();
      })
      .catch(err => {
        console.error("Error creating material", err);
        notify(
          err.response?.data?.error || (lang === 'ru' ? 'Ошибка при создании материала' : 'Materialni yaratishda xatolik yuz berdi'),
          'error'
        );
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

  const handleDeleteMaterial = async (caseId) => {
    const ok = await confirm(
      lang === 'ru'
        ? `Удалить материал ${caseId}? Это действие необратимо.`
        : `${caseId} materialini o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`
    );
    if (!ok) return;

    axios.delete(`${API_BASE}/materials/${caseId}/`)
      .then(() => {
        notify(lang === 'ru' ? 'Материал удалён' : 'Material o\'chirildi', 'success');
        fetchInitialData();
      })
      .catch(err => {
        console.error("Error deleting material", err);
        notify(lang === 'ru' ? 'Ошибка при удалении материала' : 'Materialni o\'chirishda xatolik yuz berdi', 'error');
      });
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

  // Filtered registry
  const filteredMaterials = materials.filter(m => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = `${m.id} ${m.citizen_name} ${m.citizen_phone}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (officerFilter && m.officer !== officerFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    if (monthFilter) {
      if (m.registered_at.substring(0, 7) !== monthFilter) return false;
    } else if (dateRange !== 'all') {
      const regDate = new Date(m.registered_at);
      const now = new Date();
      const diffDays = (now - regDate) / (1000 * 60 * 60 * 24);
      if (dateRange === 'today') {
        if (regDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === 'days3') {
        if (diffDays > 3) return false;
      } else if (dateRange === 'week') {
        if (diffDays > 7) return false;
      } else if (dateRange === 'month') {
        if (diffDays > 30) return false;
      }
    }
    return true;
  });

  // Months present in the data, newest first, for the specific-month filter
  const monthOptions = Array.from(new Set(materials.map(m => m.registered_at.substring(0, 7))))
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const [y, mo] = key.split('-').map(Number);
      const name = lang === 'ru' ? MONTH_NAMES_RU[mo - 1] : MONTH_NAMES_UZ[mo - 1];
      return { value: key, label: `${name} ${y}` };
    });

  const registryPageCount = Math.max(1, Math.ceil(filteredMaterials.length / REGISTRY_PAGE_SIZE));
  const pagedMaterials = filteredMaterials.slice((registryPage - 1) * REGISTRY_PAGE_SIZE, registryPage * REGISTRY_PAGE_SIZE);

  useEffect(() => {
    setRegistryPage(1);
  }, [searchQuery, dateRange, monthFilter, statusFilter, officerFilter]);

  useEffect(() => {
    if (registryPage > registryPageCount) setRegistryPage(registryPageCount);
  }, [registryPageCount]);

  const handleExportRegistry = () => {
    exportToExcel(
      lang === 'ru' ? 'reestr_materialov' : 'materiallar_reyestri',
      ['ID', lang === 'ru' ? 'Доп. ID' : 'Qo\'shimcha ID', lang === 'ru' ? 'Заявитель' : 'Murojaatchi', lang === 'ru' ? 'Телефон' : 'Telefon', lang === 'ru' ? 'Исполнитель' : 'Ijrochi', lang === 'ru' ? 'Содержание' : 'Mazmuni', 'ИИБ', lang === 'ru' ? 'Ст. УК' : 'Modda', lang === 'ru' ? 'Срок' : 'Muddat', lang === 'ru' ? 'Статус' : 'Holat'],
      filteredMaterials.map(m => {
        const off = officers.find(o => o.id === m.officer);
        return [
          m.id,
          m.extra_ids || '',
          m.citizen_name,
          m.citizen_phone,
          off ? (lang === 'ru' ? off.name_ru : off.name_uz) : '',
          lang === 'ru' ? m.title_ru : m.title_uz,
          m.iib || '',
          m.preliminary_article || '',
          formatDate(m.deadline),
          getStatusText(m.status),
        ];
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-gov-surface shadow-card p-1.5 rounded-full w-fit gap-1">
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
            <span className="w-5 h-5 bg-gov-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
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
          <div className="lg:col-span-1 bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6 space-y-4">
            <h3 className="font-semibold text-sm text-gov-text border-b border-gov-border pb-3">
              {lang === 'ru' ? 'Регистрация нового материала' : 'Yangi materialni ro\'yxatdan o\'tkazish'}
            </h3>
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'ID материала' : 'Material ID'}
                </label>
                <input
                  type="text"
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  placeholder="MAT-2026-0099"
                  className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${errors.materialId ? 'ring-2 ring-gov-danger/40' : ''}`}
                />
                {errors.materialId && <p className="text-[11px] text-gov-danger mt-1">{errors.materialId}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Дополнительные ID' : 'Qo\'shimcha ID'}
                </label>
                <div className="space-y-2">
                  {extraIds.map((val, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setExtraIds(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        placeholder="MAT-2026-0100"
                        className="block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setExtraIds(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-2 text-gov-muted hover:text-gov-danger hover:bg-rose-50 rounded transition-colors shrink-0"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setExtraIds(prev => [...prev, ''])}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gov-primary hover:bg-gov-primaryLight rounded px-2.5 py-1.5 transition-colors"
                >
                  + {lang === 'ru' ? 'Добавить ID' : 'ID qo\'shish'}
                </button>
                <p className="text-[10px] text-gov-muted mt-1">
                  {lang === 'ru'
                    ? 'Если у одного случая несколько входящих номеров'
                    : 'Agar bitta holatda bir nechta kirish raqami bo\'lsa'}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                  {lang === 'ru' ? 'Ф.И.О. Заявителя' : 'Murojaatchining F.I.Sh.'}
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${errors.citizenName ? 'ring-2 ring-gov-danger/40' : ''}`}
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
                  className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${errors.citizenPhone ? 'ring-2 ring-gov-danger/40' : ''}`}
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
                  className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all resize-none ${errors.titleRu ? 'ring-2 ring-gov-danger/40' : ''}`}
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
                  className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all resize-none ${errors.titleUz ? 'ring-2 ring-gov-danger/40' : ''}`}
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
                  className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm ${errors.officerId ? 'ring-2 ring-gov-danger/40' : ''}`}
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
                    className={`block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${errors.deadlineDays ? 'ring-2 ring-gov-danger/40' : ''}`}
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
                    className="block w-full px-3 py-2.5 rounded bg-gov-light text-sm"
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
                    onChange={(val) => {
                      setMaterialType(val);
                      setSourceFrom(getSourceOptions(val)[0].value);
                    }}
                    className="block w-full px-3 py-2.5 rounded bg-gov-light text-sm"
                    options={MATERIAL_TYPES.map(t => ({ value: t.value, label: lang === 'ru' ? t.ru : t.uz }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                    {lang === 'ru' ? 'Источник' : 'Manba'}
                  </label>
                  <Select
                    value={sourceFrom}
                    onChange={setSourceFrom}
                    className="block w-full px-3 py-2.5 rounded bg-gov-light text-sm"
                    options={getSourceOptions(materialType).map(s => ({ value: s.value, label: lang === 'ru' ? s.ru : s.uz }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                    ИИБ
                  </label>
                  <input
                    type="text"
                    value={iib}
                    onChange={(e) => setIib(e.target.value)}
                    placeholder="2"
                    className="block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1.5">
                    {lang === 'ru' ? 'Предварительная статья' : 'Dastlabki modda'}
                  </label>
                  <input
                    type="text"
                    value={preliminaryArticle}
                    onChange={(e) => setPreliminaryArticle(e.target.value)}
                    placeholder={lang === 'ru' ? 'Например: 169 УК' : 'Masalan: JK 169'}
                    className="block w-full px-3 py-2.5 rounded bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || investigators.length === 0}
                className="w-full py-3 bg-gov-primary text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors shadow-sm mt-2 disabled:opacity-50"
              >
                {submitting ? (lang === 'ru' ? 'Регистрация...' : 'Ro\'yxatga olinmoqda...') : (lang === 'ru' ? 'Зарегистрировать' : 'Ro\'yxatga olish')}
              </button>
            </form>
          </div>

          {/* Table Registry Right */}
          <div className="lg:col-span-2 bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-4">
              <h3 className="font-semibold text-sm text-gov-text text-left">
                {lang === 'ru' ? 'Реестр зарегистрированных материалов' : 'Ro\'yxatga olingan materiallar reyestri'}
              </h3>
              <ExportButton lang={lang} onClick={handleExportRegistry} />
            </div>

            <div className="relative max-w-sm mb-3">
              <SearchIcon className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gov-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ru' ? 'Поиск по ID, имени или телефону...' : 'ID, ism yoki telefon bo\'yicha qidirish...'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gov-border rounded bg-gov-surface focus:outline-none focus:ring-2 focus:ring-gov-primary/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FilterPill
                icon={<ClockIcon className="h-3.5 w-3.5" />}
                value={dateRange}
                defaultValue="all"
                onChange={e => { setDateRange(e.target.value); setMonthFilter(''); }}
                options={[
                  { value: 'all', label: lang === 'ru' ? 'Все время' : 'Barcha vaqt' },
                  { value: 'today', label: lang === 'ru' ? 'Сегодня' : 'Bugun' },
                  { value: 'days3', label: lang === 'ru' ? 'Посл. 3 дня' : 'Oxirgi 3 kun' },
                  { value: 'week', label: lang === 'ru' ? 'За неделю' : 'Shu hafta' },
                  { value: 'month', label: lang === 'ru' ? 'Последние 30 дней' : 'Oxirgi 30 kun' },
                ]}
              />
              <FilterPill
                icon={<DashboardIcon className="h-3.5 w-3.5" />}
                value={monthFilter}
                defaultValue=""
                onChange={e => { setMonthFilter(e.target.value); if (e.target.value) setDateRange('all'); }}
                options={[
                  { value: '', label: lang === 'ru' ? 'Конкретный месяц' : 'Aniq oy' },
                  ...monthOptions,
                ]}
              />
              <FilterPill
                icon={<UsersIcon className="h-3.5 w-3.5" />}
                value={officerFilter}
                defaultValue=""
                onChange={e => setOfficerFilter(e.target.value)}
                options={[
                  { value: '', label: lang === 'ru' ? 'Все следователи' : 'Barcha tergovchilar' },
                  ...investigators.map(o => ({ value: o.id, label: lang === 'ru' ? o.name_ru : o.name_uz })),
                ]}
              />
              <FilterPill
                value={statusFilter}
                defaultValue=""
                onChange={e => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: lang === 'ru' ? 'Статус: все' : 'Holat: barchasi' },
                  { value: 'изучаемый', label: lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda' },
                  { value: 'срок_приближается', label: lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda' },
                  { value: 'срок_нарушен', label: lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan' },
                  { value: 'закрыт_в_срок', label: lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi' },
                ]}
              />
              {(dateRange !== 'all' || monthFilter || statusFilter || officerFilter || searchQuery) && (
                <button
                  onClick={() => { setDateRange('all'); setMonthFilter(''); setStatusFilter(''); setOfficerFilter(''); setSearchQuery(''); }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gov-danger hover:bg-rose-50 rounded-full px-3 py-2 transition-colors"
                >
                  <CloseIcon className="h-3.5 w-3.5" /> {lang === 'ru' ? 'Сбросить' : 'Tozalash'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Заявитель' : 'Murojaatchi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Исполнитель' : 'Ijrochi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Содержание' : 'Mazmuni'}</th>
                    <th className="px-4 py-3">ИИБ</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Ст. УК' : 'Modda'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Срок' : 'Muddat'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Статус' : 'Status'}</th>
                    <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Действия' : 'Amallar'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {pagedMaterials.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center text-gov-muted font-medium">{lang === 'ru' ? 'Материалов нет' : 'Materiallar yo\'q'}</td>
                    </tr>
                  )}
                  {pagedMaterials.map(m => {
                    const officer = officers.find(o => o.id === m.officer);
                    const officerName = officer ? (lang === 'ru' ? officer.name_ru.split(' ')[0] + ' ' + officer.name_ru.split(' ')[1][0] + '.' : officer.name_uz.split(' ')[0]) : '';
                    return (
                      <tr key={m.id} className="hover:bg-gov-light/30">
                        <td className="px-4 py-3 font-semibold text-gov-text">
                          {m.id}
                          {m.extra_ids && <p className="text-[10px] font-normal text-gov-muted mt-0.5">+ {m.extra_ids}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gov-text">{m.citizen_name}</p>
                          <p className="text-[10px] text-gov-muted mt-0.5">{m.citizen_phone}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-gov-muted">{officerName}</td>
                        <td className="px-4 py-3 text-gov-muted max-w-[150px] truncate" title={lang === 'ru' ? m.title_ru : m.title_uz}>
                          {lang === 'ru' ? m.title_ru : m.title_uz}
                        </td>
                        <td className="px-4 py-3 text-gov-muted">{m.iib || '—'}</td>
                        <td className="px-4 py-3 text-gov-muted">{m.preliminary_article || '—'}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gov-text">{formatDate(m.deadline)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none ${getStatusClass(m.status)}`}>
                            {getStatusText(m.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onViewDetails(m.id)}
                              className="p-1.5 bg-gov-border/20 border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors inline-flex"
                              title="Details"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(m.id)}
                              className="p-1.5 bg-gov-border/20 border border-gov-border text-gov-danger rounded hover:bg-rose-50 hover:border-rose-200 transition-colors inline-flex"
                              title={lang === 'ru' ? 'Удалить' : 'O\'chirish'}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredMaterials.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gov-border">
                <p className="text-[11px] text-gov-muted">
                  {lang === 'ru'
                    ? `Показано ${(registryPage - 1) * REGISTRY_PAGE_SIZE + 1}–${Math.min(registryPage * REGISTRY_PAGE_SIZE, filteredMaterials.length)} из ${filteredMaterials.length}`
                    : `${(registryPage - 1) * REGISTRY_PAGE_SIZE + 1}–${Math.min(registryPage * REGISTRY_PAGE_SIZE, filteredMaterials.length)} / ${filteredMaterials.length} ta ko'rsatilmoqda`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRegistryPage(p => Math.max(1, p - 1))}
                    disabled={registryPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold border border-gov-border rounded text-gov-text hover:bg-gov-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {lang === 'ru' ? 'Назад' : 'Oldingi'}
                  </button>
                  <span className="px-2 text-xs font-semibold text-gov-muted">
                    {registryPage} / {registryPageCount}
                  </span>
                  <button
                    onClick={() => setRegistryPage(p => Math.min(registryPageCount, p + 1))}
                    disabled={registryPage === registryPageCount}
                    className="px-3 py-1.5 text-xs font-semibold border border-gov-border rounded text-gov-text hover:bg-gov-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {lang === 'ru' ? 'Вперёд' : 'Keyingi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Approvals Tab */
        <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6">
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
                        <button
                          onClick={() => onViewDetails(req.case)}
                          className="text-xs font-bold text-gov-primary hover:underline transition-colors"
                          title={lang === 'ru' ? 'Открыть материал' : 'Materialni ochish'}
                        >
                          {req.case}
                        </button>
                        <span className="text-[10px] font-semibold text-gov-muted bg-gov-surface border border-gov-border px-1.5 py-0.5 rounded uppercase">
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
