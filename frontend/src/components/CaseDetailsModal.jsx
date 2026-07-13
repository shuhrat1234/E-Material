import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, TRANSLATIONS } from '../App';
import { CheckIcon, CloseIcon } from './Icons';
import Modal from './Modal';
import Select from './ui/Select';
import { notify } from '../toastService';
import { getMaterialTypeLabel, getSourceLabel } from '../materialTaxonomy';

function CaseDetailsModal({ caseId, lang, user, onClose }) {
  const [activeTab, setActiveTab] = useState('info'); // info, timeline
  const [caseItem, setCaseItem] = useState(null);
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStepText, setNewStepText] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [statusDraft, setStatusDraft] = useState(null);

  const fetchCaseDetails = () => {
    if (!caseId) return;
    axios.get(`${API_BASE}/materials/${caseId}/`)
      .then(res => {
        setCaseItem(res.data);
        setStatusDraft(res.data.status);
        if (res.data.officer) {
          axios.get(`${API_BASE}/officers/${res.data.officer}/`)
            .then(oRes => {
              setOfficer(oRes.data);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    fetchCaseDetails();
  }, [caseId]);

  const handleStatusChange = (newStatus) => {
    if (!newStatus || newStatus === caseItem.status) return;
    setChangingStatus(true);
    axios.patch(`${API_BASE}/materials/${caseId}/`, { status: newStatus })
      .then(() => {
        setChangingStatus(false);
        fetchCaseDetails();
      })
      .catch(err => {
        console.error(err);
        setChangingStatus(false);
        notify(lang === 'ru' ? 'Ошибка при изменении статуса' : 'Statusni o\'zgartirishda xatolik', 'error');
      });
  };

  const handleAddStep = (e) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    setAddingStep(true);
    axios.post(`${API_BASE}/materials/${caseId}/add-step/`, {
      status: newStepText,
      user_name: user?.name || 'Сотрудник'
    })
      .then(() => {
        setNewStepText('');
        setAddingStep(false);
        fetchCaseDetails();
      })
      .catch(err => {
        console.error(err);
        setAddingStep(false);
        notify(lang === 'ru' ? 'Ошибка при добавлении этапа' : 'Bosqichni qo\'shishda xatolik yuz berdi', 'error');
      });
  };

  if (loading) {
    return (
      <Modal onClose={onClose} maxWidth="max-w-sm">
        <div className="p-8 text-center text-gov-muted text-xs font-semibold">
          {lang === 'ru' ? 'Загрузка информации...' : 'Ma\'lumot yuklanmoqda...'}
        </div>
      </Modal>
    );
  }

  if (!caseItem) return null;

  const t = TRANSLATIONS[lang];

  const getStatusBadge = (status) => {
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


  // Timeline milestones: only the actually recorded appeal steps (no fabricated placeholders)
  const timelineSteps = [
    { key: "Обращение гражданина", ru: "Обращение гражданина зарегистрировано", uz: "Fuqaro murojaati ro'yxatga olindi" }
  ];

  const displayList = (caseItem.appeals || []).map(a => {
    const standardStep = timelineSteps.find(step => step.key === a.status);
    return {
      status: a.status,
      title: standardStep ? (lang === 'ru' ? standardStep.ru : standardStep.uz) : a.status,
      time: a.time,
      isCompleted: true
    };
  });

  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <div className="p-6 flex flex-col flex-1 min-h-0">

        {/* Header */}
        <div className="flex justify-between items-start border-b border-gov-border pb-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gov-primary">{caseItem.id}</span>
            </div>
            <p className="text-xs text-gov-text font-semibold">{caseItem.citizen_name}</p>
            <p className="text-[10px] text-gov-muted font-medium">{caseItem.citizen_phone}</p>
          </div>
          <button onClick={onClose} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors"><CloseIcon className="h-5 w-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gov-border shrink-0 text-xs font-semibold mt-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-4 -mb-[1px] border-b-2 transition-all ${
              activeTab === 'info' ? 'border-gov-primary text-gov-primary font-bold' : 'border-transparent text-gov-muted hover:text-gov-text'
            }`}
          >
            {t.info_tab}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-4 -mb-[1px] border-b-2 transition-all ${
              activeTab === 'timeline' ? 'border-gov-primary text-gov-primary font-bold' : 'border-transparent text-gov-muted hover:text-gov-text'
            }`}
          >
            {t.timeline_tab}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          
          {activeTab === 'info' ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Содержание обращения' : 'Murojaat mazmuni'}</p>
                <div className="flex items-start justify-between gap-3 bg-gov-light/45 p-3 border border-gov-border rounded">
                  <p className="text-gov-text leading-relaxed font-medium min-w-0 flex-1 break-words">
                    {lang === 'ru' ? caseItem.title_ru : caseItem.title_uz}
                  </p>
                  <span className={`px-2 py-0.5 border rounded text-[10px] font-semibold leading-none shrink-0 ${getStatusBadge(caseItem.status)}`}>
                    {getStatusText(caseItem.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 border border-gov-border rounded p-2.5 bg-gov-light/45">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Исполнитель' : 'Ijrochi'}</p>
                  <p className="text-gov-text font-semibold">{officer ? (lang === 'ru' ? officer.name_ru : officer.name_uz) : (lang === 'ru' ? 'Не назначен' : 'Tayinlanmagan')}</p>
                </div>
                <div className="space-y-1 border border-gov-border rounded p-2.5 bg-gov-light/45">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Дата регистрации' : 'Ro\'yxatga olingan sana'}</p>
                  <p className="text-gov-text font-semibold font-mono">{formatDate(caseItem.registered_at)}</p>
                </div>
                <div className="space-y-1 border border-gov-border rounded p-2.5 bg-gov-light/45">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Срок исполнения' : 'Bajarish muddati'}</p>
                  <p className="text-gov-text font-semibold font-mono">{formatDate(caseItem.deadline)}</p>
                </div>
                <div className="space-y-1 border border-gov-border rounded p-2.5 bg-gov-light/45">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Продления' : 'Uzaytirishlar'}</p>
                  <p className="text-gov-text font-semibold">{caseItem.extension_count}</p>
                </div>
                <div className="space-y-1 border border-gov-border rounded p-2.5 bg-gov-light/45">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Сложность' : 'Murakkablik'}</p>
                  <p className="text-gov-text font-semibold">{caseItem.difficulty}</p>
                </div>
                <div className="space-y-1 border border-gov-border rounded p-2.5 bg-gov-light/45">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Тип материала' : 'Material turi'}</p>
                  <p className="text-gov-text font-semibold">{getMaterialTypeLabel(caseItem.material_type, lang)}</p>
                </div>
                <div className="space-y-1 border border-gov-border rounded p-2.5 bg-gov-light/45">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Источник' : 'Manba'}</p>
                  <p className="text-gov-text font-semibold">{getSourceLabel(caseItem.source_from, lang)}</p>
                </div>
              </div>

              {caseItem.citizen_notification_text && (
                <div className="space-y-1 pt-2 border-t border-gov-border">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Отправленное SMS-уведомление' : 'Yuborilgan SMS-xabarnoma'}</p>
                  <p className="text-gov-muted leading-relaxed bg-gov-light/45 p-3 border border-gov-border rounded whitespace-pre-line">
                    {caseItem.citizen_notification_text}
                  </p>
                </div>
              )}

              {/* Status Change */}
              <div className="space-y-2 pt-2 border-t border-gov-border">
                <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Статус дела' : 'Ish holati'}</p>
                <div className="flex gap-2 items-center">
                  <Select
                    value={statusDraft ?? caseItem.status}
                    onChange={setStatusDraft}
                    className="flex-1 text-xs p-2 border border-gov-border rounded bg-gov-light"
                    options={[
                      { value: 'изучаемый', label: lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda' },
                      { value: 'срок_приближается', label: lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda' },
                      { value: 'срок_нарушен', label: lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan' },
                      { value: 'закрыт_в_срок', label: lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi' },
                    ]}
                  />
                  <button
                    disabled={changingStatus}
                    onClick={() => handleStatusChange(statusDraft)}
                    className="px-4 py-2 bg-gov-primary hover:bg-blue-700 text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-50 shrink-0"
                  >
                    {changingStatus ? '...' : (lang === 'ru' ? 'Сохранить' : 'Saqlash')}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* Timeline Tab */
            <div className="space-y-4 text-xs text-left max-w-md mx-auto py-2">
              {displayList.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start relative pb-6 border-l border-gov-border pl-6 last:pb-0 last:border-transparent">
                  <div className={`w-5 h-5 rounded-full absolute -left-[10px] top-0.5 flex items-center justify-center text-[10px] font-bold border transition-colors ${
                    step.isCompleted 
                      ? 'bg-gov-success text-white border-transparent' 
                      : step.isCurrent 
                        ? 'bg-gov-blue/15 text-gov-blue border-gov-blue' 
                        : 'bg-gov-surface text-gov-muted border-gov-border'
                  }`}>
                    {step.isCompleted ? <CheckIcon className="h-3 w-3" /> : idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className={`font-semibold text-xs ${step.isCompleted ? 'text-gov-text' : 'text-gov-muted'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[10px] font-medium text-gov-muted">
                      {step.isCompleted 
                        ? formatDate(step.time) 
                        : (step.isCurrent 
                          ? (lang === 'ru' ? 'В процессе...' : 'Jarayonda...') 
                          : (lang === 'ru' ? 'Ожидание...' : 'Kutilmoqda...'))
                      }
                    </p>
                  </div>
                </div>
              ))}

              {/* Add Custom Step Form */}
              <form onSubmit={handleAddStep} className="mt-6 pt-4 border-t border-gov-border flex gap-2">
                <input
                  type="text"
                  required
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder={lang === 'ru' ? "Добавить новое действие..." : "Yangi harakat qo'shish..."}
                  className="flex-1 px-3 py-1.5 border border-gov-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                />
                <button
                  type="submit"
                  disabled={addingStep}
                  className="px-4 py-1.5 bg-gov-primary hover:bg-blue-700 text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {addingStep ? '...' : (lang === 'ru' ? "Добавить" : "Qo'shish")}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-gov-border pt-4 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gov-primary text-white text-xs font-semibold rounded hover:bg-blue-700 border border-transparent"
          >
            {t.common_close}
          </button>
        </div>

      </div>
    </Modal>
  );
}

export default CaseDetailsModal;
