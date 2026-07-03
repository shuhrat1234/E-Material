import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, TRANSLATIONS } from '../App';

function CaseDetailsModal({ caseId, lang, user, onClose }) {
  const [activeTab, setActiveTab] = useState('info'); // info, timeline
  const [caseItem, setCaseItem] = useState(null);
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStepText, setNewStepText] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [addingStep, setAddingStep] = useState(false);

  const fetchCaseDetails = () => {
    if (!caseId) return;
    axios.get(`${API_BASE}/materials/${caseId}/`)
      .then(res => {
        setCaseItem(res.data);
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
        alert(lang === 'ru' ? 'Ошибка при изменении статуса' : 'Statusni o\'zgartirishda xatolik');
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
        alert(lang === 'ru' ? 'Ошибка при добавлении этапа' : 'Bosqichni qo\'shishda xatolik yuz berdi');
      });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[120] bg-gov-navy/40 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white border border-gov-border rounded-lg max-w-sm w-full p-8 text-center shadow-lg text-gov-muted text-xs font-semibold">
          Загрузка информации...
        </div>
      </div>
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

  // Compile timeline milestones
  const timelineSteps = [
    { key: "Обращение гражданина", ru: "Обращение гражданина зарегистрировано", uz: "Fuqaro murojaati ro'yxatga olindi" },
    { key: "Анализ и решение", ru: "Проводится доследственная проверка (Анализ)", uz: "Tergov oldi tekshiruvi boshlandi (Tahlil)" },
    { key: "Оперативная отправка уведомления", ru: "Сформировано и отправлено уведомление", uz: "Xabarnoma tayyorlandi va yuborildi" },
    { key: "Прием гражданином уведомления", ru: "Уведомление доставлено адресату", uz: "Xabarnoma murojaatchiga yetkazildi" }
  ];

  const completedKeys = (caseItem.appeals || []).map(a => a.status);
  const displayList = [];

  // Add all completed appeals in order
  (caseItem.appeals || []).forEach(a => {
    const standardStep = timelineSteps.find(step => step.key === a.status);
    displayList.push({
      status: a.status,
      title: standardStep ? (lang === 'ru' ? standardStep.ru : standardStep.uz) : a.status,
      time: a.time,
      isCompleted: true
    });
  });

  // Add pending standard steps
  let foundFirstPending = false;
  timelineSteps.forEach(step => {
    if (!completedKeys.includes(step.key)) {
      displayList.push({
        status: step.key,
        title: lang === 'ru' ? step.ru : step.uz,
        time: null,
        isCompleted: false,
        isCurrent: !foundFirstPending
      });
      foundFirstPending = true;
    }
  });

  return (
    <div className="fixed inset-0 z-[120] bg-gov-navy/40 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white border border-gov-border rounded-lg max-w-xl w-full p-6 shadow-lg text-left flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gov-border pb-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gov-navy">{caseItem.id}</span>
              <select
                value={caseItem.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={changingStatus}
                className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none cursor-pointer focus:outline-none ${getStatusBadge(caseItem.status)} disabled:opacity-60`}
              >
                <option value="изучаемый">{lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda'}</option>
                <option value="срок_приближается">{lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda'}</option>
                <option value="срок_нарушен">{lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan'}</option>
                <option value="закрыт_в_срок">{lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi'}</option>
              </select>
              {changingStatus && <span className="text-[10px] text-gov-muted animate-pulse">...</span>}
            </div>
            <p className="text-xs text-gov-text font-semibold">{caseItem.citizen_name}</p>
            <p className="text-[10px] text-gov-muted font-medium">{caseItem.citizen_phone}</p>
          </div>
          <button onClick={onClose} className="text-gov-muted hover:text-gov-text text-xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gov-border shrink-0 text-xs font-semibold mt-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-4 -mb-[1px] border-b-2 transition-all ${
              activeTab === 'info' ? 'border-gov-navy text-gov-navy font-bold' : 'border-transparent text-gov-muted hover:text-gov-text'
            }`}
          >
            {t.info_tab}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-4 -mb-[1px] border-b-2 transition-all ${
              activeTab === 'timeline' ? 'border-gov-navy text-gov-navy font-bold' : 'border-transparent text-gov-muted hover:text-gov-text'
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
                <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Содержание обращения</p>
                <p className="text-gov-text leading-relaxed font-medium bg-gov-light/45 p-3 border border-gov-border rounded">
                  {lang === 'ru' ? caseItem.title_ru : caseItem.title_uz}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Исполнитель</p>
                  <p className="text-gov-text font-semibold">{officer ? (lang === 'ru' ? officer.name_ru : officer.name_uz) : 'Не назначен'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Срок исполнения</p>
                  <p className="text-gov-text font-semibold font-mono">{formatDate(caseItem.deadline)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Продления</p>
                  <p className="text-gov-text font-semibold">{caseItem.extension_count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Сложность</p>
                  <p className="text-gov-text font-semibold">{caseItem.difficulty}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Тип материала</p>
                  <p className="text-gov-text font-semibold uppercase">{caseItem.material_type}</p>
                </div>
              </div>

              {/* Status Change */}
              <div className="space-y-2 pt-2 border-t border-gov-border">
                <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Статус дела' : 'Ish holati'}</p>
                <div className="flex gap-2 items-center">
                  <select
                    id="status-select"
                    defaultValue={caseItem.status}
                    key={caseItem.status}
                    className="flex-1 text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                  >
                    <option value="изучаемый">{lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda'}</option>
                    <option value="срок_приближается">{lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda'}</option>
                    <option value="срок_нарушен">{lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan'}</option>
                    <option value="закрыт_в_срок">{lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi'}</option>
                  </select>
                  <button
                    disabled={changingStatus}
                    onClick={() => {
                      const sel = document.getElementById('status-select');
                      if (sel) handleStatusChange(sel.value);
                    }}
                    className="px-4 py-2 bg-gov-navy hover:bg-gov-slate text-white text-[11px] font-semibold rounded uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
                  >
                    {changingStatus ? '...' : (lang === 'ru' ? 'Сохранить' : 'Saqlash')}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gov-border">
                <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Оповещение заявителя (Virtual SMS)</p>
                <div className="p-3 bg-gov-light/35 border border-gov-border rounded font-mono text-[10px] leading-relaxed text-gov-muted">
                  {caseItem.citizen_notification_text ? (
                    <span>{caseItem.citizen_notification_text}</span>
                  ) : (
                    <span>[Virtual SMS/Telegram] Уважаемый(ая) {caseItem.citizen_name}! Сообщаем, что по вашему обращению №{caseItem.id} проводится доследственная проверка. С уважением, Олмазорский РУВД.</span>
                  )}
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
                        : 'bg-white text-gov-muted border-gov-border'
                  }`}>
                    {step.isCompleted ? '✓' : idx + 1}
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
                  className="px-4 py-1.5 bg-gov-navy hover:bg-gov-slate text-white text-[11px] font-semibold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
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
            className="px-4 py-2 bg-gov-navy text-white text-xs font-semibold rounded hover:bg-gov-slate uppercase tracking-wider border border-transparent shadow-sm"
          >
            {t.common_close}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CaseDetailsModal;
