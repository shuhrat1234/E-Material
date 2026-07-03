import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

function ChiefView({ lang, onViewDetails, user }) {
  const [activePanel, setActivePanel] = useState('dashboard'); // dashboard, materials, ratings, approvals
  const [officers, setOfficers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  // Filter States
  const [dateRange, setDateRange] = useState('all');
  const [difficulty, setDifficulty] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [sourceFrom, setSourceFrom] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get(`${API_BASE}/officers/`)
      .then(res => setOfficers(res.data));

    axios.get(`${API_BASE}/materials/`)
      .then(res => setMaterials(res.data));

    axios.get(`${API_BASE}/approvals/`)
      .then(res => setApprovalRequests(res.data));
  };

  // Filter materials
  const filteredMaterials = materials.filter(c => {
    if (dateRange !== 'all') {
      const regDate = new Date(c.registered_at);
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
    if (difficulty && c.difficulty != difficulty) return false;
    if (materialType && c.material_type !== materialType) return false;
    if (sourceFrom && c.source_from !== sourceFrom) return false;
    return true;
  });

  const total = filteredMaterials.length;
  const newCount = filteredMaterials.filter(m => {
    const d = new Date(m.registered_at);
    const now = new Date();
    return (now - d) < (86400000 * 3);
  }).length;
  const activeCount = filteredMaterials.filter(m => m.status !== 'закрыт_в_срок').length;
  const closedCount = filteredMaterials.filter(m => m.status === 'закрыт_в_срок').length;
  const overdueCount = filteredMaterials.filter(m => m.status === 'срок_нарушен').length;

  const calculateDeadlines = () => {
    const offsets = { today: 0, tomorrow: 0, indinga: 0, days3: 0 };
    const now = new Date();
    const dStr = (offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d.toISOString().substring(0, 10);
    };
    
    filteredMaterials.forEach(m => {
      if (m.status === 'закрыт_в_срок') return;
      const dl = new Date(m.deadline).toISOString().substring(0,10);
      if (dl === dStr(0)) offsets.today++;
      else if (dl === dStr(1)) offsets.tomorrow++;
      else if (dl === dStr(2)) offsets.indinga++;
      else if (dl === dStr(3)) offsets.days3++;
    });
    return offsets;
  };

  const dl = calculateDeadlines();

  const handleReassign = (caseId, newOfficerId) => {
    if (!newOfficerId) return;
    axios.post(`${API_BASE}/materials/${caseId}/reassign/`, { new_officer_id: newOfficerId })
      .then(() => {
        alert(lang === 'ru' ? 'Исполнитель успешно изменен!' : 'Ijrochi muvaffaqiyatli o\'zgartirildi!');
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const handleApprove = (caseId) => {
    axios.post(`${API_BASE}/approvals/${caseId}/approve/`)
      .then(() => {
        alert(lang === 'ru' ? 'Решение успешно утверждено!' : 'Qaror muvaffaqiyatli tasdiqlandi!');
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const handleReject = (caseId) => {
    axios.post(`${API_BASE}/approvals/${caseId}/reject/`)
      .then(() => {
        alert(lang === 'ru' ? 'Решение отклонено!' : 'Qaror rad etildi!');
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const handleInlineStatusChange = (caseId, newStatus) => {
    axios.patch(`${API_BASE}/materials/${caseId}/`, { status: newStatus })
      .then(() => fetchData())
      .catch(err => console.error('Status update failed:', err));
  };

  // Charts
  const getDinamikaData = () => {
    const datesMap = {};
    filteredMaterials.forEach(c => {
      const d = c.registered_at.substring(0,10);
      datesMap[d] = (datesMap[d] || 0) + 1;
    });
    const sorted = Object.keys(datesMap).sort();
    return {
      labels: sorted.map(d => d.split('-').slice(1).reverse().join('.')),
      datasets: [{
        label: lang === 'ru' ? 'Регистраций' : 'Ro\'yxatga olishlar',
        data: sorted.map(d => datesMap[d]),
        borderColor: '#0b132b',
        backgroundColor: 'rgba(11, 19, 43, 0.05)',
        tension: 0.2,
        fill: true
      }]
    };
  };

  const getOfficersRatingData = () => {
    const names = officers.map(o => lang === 'ru' ? o.name_ru.split(' ')[0] : o.name_uz.split(' ')[0]);
    const indices = officers.map(o => o.index);
    return {
      labels: names,
      datasets: [{
        label: lang === 'ru' ? 'Индекс удовлетворенности %' : 'Mamnunlik indeksi %',
        data: indices,
        backgroundColor: '#0b132b'
      }]
    };
  };

  const getTypesData = () => {
    const counts = { ariza: 0, bildirgi: 0, sud_ajrimi: 0, boshqa: 0 };
    filteredMaterials.forEach(c => {
      const t = c.material_type || 'ariza';
      if (counts[t] !== undefined) counts[t]++;
    });
    return {
      labels: lang === 'ru' ? ["Заявление", "Рапорт", "Суд. решение", "Другое"] : ["Ariza", "Bildirgi", "Sud qarori", "Boshqa"],
      datasets: [{
        data: [counts.ariza, counts.bildirgi, counts.sud_ajrimi, counts.boshqa],
        backgroundColor: ['#0b132b', '#1c2541', '#3a506b', '#cbd5e1']
      }]
    };
  };

  const getDifficultyData = () => {
    const counts = [0, 0, 0, 0, 0];
    filteredMaterials.forEach(c => {
      if (c.difficulty >= 1 && c.difficulty <= 5) counts[c.difficulty - 1]++;
    });
    return {
      labels: ["1", "2", "3", "4", "5"],
      datasets: [{
        data: counts,
        backgroundColor: ['#0b132b', '#1c2541', '#3a506b', '#64748b', '#cbd5e1']
      }]
    };
  };

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

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      {/* Sidebar Nav */}
      <nav className="w-full md:w-64 bg-white border border-gov-border rounded-lg p-4 shadow-sm space-y-1 shrink-0 text-left">
        <div className="p-3 border-b border-gov-border mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gov-navy text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {user?.photo || (user?.name ? user.name[0] : 'М')}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-xs text-gov-text truncate">{user?.name || ''}</h4>
              <p className="text-[10px] text-gov-muted mt-0.5 truncate uppercase tracking-wider font-bold">
                {user?.roleLabel || (lang === 'ru' ? 'Начальник' : 'Boshliq')}
              </p>
            </div>
          </div>
        </div>

        <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5">Разделы</div>
        <button
          onClick={() => setActivePanel('dashboard')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-3 ${
            activePanel === 'dashboard' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <span>📊</span> {lang === 'ru' ? 'Панель управления' : 'Boshqaruv paneli'}
        </button>
        <button
          onClick={() => setActivePanel('materials')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex justify-between items-center ${
            activePanel === 'materials' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>📁</span> {lang === 'ru' ? 'Все материалы' : 'Barcha materiallar'}
          </div>
          <span className="bg-gov-blue/10 text-gov-blue px-2 py-0.5 rounded text-[10px] font-bold">
            {materials.filter(m => m.status !== 'закрыт_в_срок').length}
          </span>
        </button>
        <button
          onClick={() => setActivePanel('ratings')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-3 ${
            activePanel === 'ratings' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <span>👥</span> {lang === 'ru' ? 'Рейтинг сотрудников' : 'Xodimlar reytingi'}
        </button>
        <button
          onClick={() => setActivePanel('approvals')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex justify-between items-center ${
            activePanel === 'approvals' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>✍</span> {lang === 'ru' ? 'Тасдиклаш' : 'Tasdiqlash'}
          </div>
          {approvalRequests.length > 0 && (
            <span className="bg-gov-danger text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {approvalRequests.length}
            </span>
          )}
        </button>

        <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5 pt-6">Сводка</div>
        <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
          <span>{lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}:</span>
          <span className="font-bold text-gov-danger">{materials.filter(m => m.status === 'срок_нарушен').length}</span>
        </div>
        <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
          <span>{lang === 'ru' ? 'Истекает сегодня' : 'Bugun tugaydi'}:</span>
          <span className="font-bold text-gov-warning">{dl.today}</span>
        </div>
      </nav>

      {/* Content Area */}
      <div className="flex-1 w-full space-y-6">
        
        {(activePanel === 'dashboard' || activePanel === 'materials') && (
          <div className="bg-white border border-gov-border rounded-lg p-5 shadow-sm text-left space-y-3">
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text">
              {lang === 'ru' ? 'Фильтры управления' : 'Boshqaruv filtrlari'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="col-span-2">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  {lang === 'ru' ? 'Период регистрации' : 'Ro\'yxatga olingan davr'}
                </label>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none">
                  <option value="all">{lang === 'ru' ? 'Все время' : 'Barcha vaqt'}</option>
                  <option value="today">{lang === 'ru' ? 'Сегодня' : 'Bugun'}</option>
                  <option value="days3">{lang === 'ru' ? 'Последние 3 дня' : 'Oxirgi 3 kun'}</option>
                  <option value="week">{lang === 'ru' ? 'За неделю' : 'Shu hafta'}</option>
                  <option value="month">{lang === 'ru' ? 'За месяц' : 'Shu oy'}</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  {lang === 'ru' ? 'Сложность' : 'Murakkablik'}
                </label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none">
                  <option value="">{lang === 'ru' ? 'Все сложности' : 'Barcha murakkabliklar'}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  {lang === 'ru' ? 'Тип материала' : 'Material turi'}
                </label>
                <select value={materialType} onChange={e => setMaterialType(e.target.value)} className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none">
                  <option value="">{lang === 'ru' ? 'Все типы' : 'Barcha turlar'}</option>
                  <option value="ariza">Ariza</option>
                  <option value="bildirgi">Bildirgi</option>
                  <option value="sud_ajrimi">Opredelenie</option>
                  <option value="boshqa">Boshqa</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  {lang === 'ru' ? 'Источник' : 'Manba'}
                </label>
                <select value={sourceFrom} onChange={e => setSourceFrom(e.target.value)} className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none">
                  <option value="">{lang === 'ru' ? 'Все источники' : 'Barcha manbalar'}</option>
                  <option value="tashrif">Tambur</option>
                  <option value="prakuratura">Prokuratura</option>
                  <option value="prezident_aparat">Prezident ap.</option>
                  <option value="iio">IIO</option>
                  <option value="portal">Portal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Panel 1: Dashboard */}
        {activePanel === 'dashboard' && (
          <div className="space-y-6">
            {/* Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-muted">
                <p className="text-xl font-bold text-gov-text">{total}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Жами материаллар</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-blue">
                <p className="text-xl font-bold text-gov-blue">{newCount}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Янги материаллар</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-warning">
                <p className="text-xl font-bold text-gov-warning">{activeCount}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Ижродаги</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-success">
                <p className="text-xl font-bold text-gov-success">{closedCount}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Бажарилган</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-danger col-span-2 md:col-span-1">
                <p className="text-xl font-bold text-gov-danger">{overdueCount}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Муддати бузилган</p>
              </div>
            </div>

            {/* Deadline offsets control panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-left">
              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm space-y-3">
                <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-2">
                  Муддат назорати (Контроль сроков)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-dashed border-gov-border pb-1">
                    <span>Бугун (Сегодня)</span>
                    <span className="font-bold text-gov-danger bg-rose-50 px-2 py-0.5 border border-rose-100 rounded">{dl.today}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gov-border pb-1">
                    <span>Эртага (Завтра)</span>
                    <span className="font-bold text-gov-warning bg-amber-50 px-2 py-0.5 border border-amber-100 rounded">{dl.tomorrow}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gov-border pb-1">
                    <span>Индинга (Послезавтра)</span>
                    <span className="font-bold text-gov-text bg-gov-light px-2 py-0.5 border border-gov-border rounded">{dl.indinga}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>3 кун ичида (В течение 3-х дней)</span>
                    <span className="font-bold text-gov-text bg-gov-light px-2 py-0.5 border border-gov-border rounded">{dl.days3}</span>
                  </div>
                </div>
              </div>

              {/* Approvals Cues Overview */}
              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm space-y-3 col-span-2">
                <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-2">
                  Тасдиклаш учун (Очередь согласования решений)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded flex justify-between items-center text-gov-danger">
                    <span>Резолюция учун (Решения)</span>
                    <strong className="text-sm font-bold">{approvalRequests.length}</strong>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded flex justify-between items-center text-gov-warning">
                    <span>Муддат узайтиришга (Сроки)</span>
                    <strong className="text-sm font-bold">0</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm">
                <h5 className="font-semibold text-xs text-gov-text uppercase tracking-wider mb-4 text-left">Регистрация материалов</h5>
                <div className="h-64">
                  <Line data={getDinamikaData()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm">
                <h5 className="font-semibold text-xs text-gov-text uppercase tracking-wider mb-4 text-left">Рейтинг следователей %</h5>
                <div className="h-64">
                  <Bar data={getOfficersRatingData()} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: All Materials with Reassignments */}
        {activePanel === 'materials' && (
          <div className="bg-white border border-gov-border rounded-lg p-6 shadow-sm">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              Мониторинг всех материалов доследственной проверки
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Исполнитель / Переназначить</th>
                    <th className="px-4 py-3">Заявитель</th>
                    <th className="px-4 py-3">Содержание</th>
                    <th className="px-4 py-3">Срок</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3 text-center">Просмотр</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {filteredMaterials.map(c => {
                    const activeOff = officers.find(o => o.id === c.officer);
                    const activeName = activeOff ? activeOff.name_ru.split(' ')[0] : '';
                    
                    return (
                      <tr key={c.id} className="hover:bg-gov-light/30">
                        <td className="px-4 py-3 font-semibold text-gov-text">{c.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gov-text mb-1">{activeName}</p>
                          {c.status !== 'закрыт_в_срок' && (
                            <select
                              onChange={(e) => handleReassign(c.id, e.target.value)}
                              className="text-[10px] p-1 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                              defaultValue=""
                            >
                              <option value="" disabled>-- Переназначить --</option>
                              {officers.filter(o => o.id !== c.officer).map(o => (
                                <option key={o.id} value={o.id}>{o.name_ru.split(' ')[0]}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">{c.citizen_name}</td>
                        <td className="px-4 py-3 text-gov-muted max-w-[150px] truncate" title={lang === 'ru' ? c.title_ru : c.title_uz}>
                          {lang === 'ru' ? c.title_ru : c.title_uz}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gov-text">{formatDate(c.deadline)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={c.status}
                            onChange={e => handleInlineStatusChange(c.id, e.target.value)}
                            className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none cursor-pointer focus:outline-none`}
                          >
                            <option value="изучаемый">{lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda'}</option>
                            <option value="срок_приближается">{lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda'}</option>
                            <option value="срок_нарушен">{lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan'}</option>
                            <option value="закрыт_в_срок">{lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi'}</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onViewDetails(c.id)}
                            className="px-2 py-1 bg-gov-light border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors text-[10px] font-bold"
                          >
                            👁
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel 3: Staff Rating */}
        {activePanel === 'ratings' && (
          <div className="bg-white border border-gov-border rounded-lg p-6 shadow-sm">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              Рейтинг и показатели сотрудников отделения
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">Следователь</th>
                    <th className="px-4 py-3">Подразделение</th>
                    <th className="px-4 py-3">Likes</th>
                    <th className="px-4 py-3">Dislikes</th>
                    <th className="px-4 py-3">Всего дел</th>
                    <th className="px-4 py-3">В производстве</th>
                    <th className="px-4 py-3">Индекс mamnunlik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {officers.map(o => {
                    const cases = materials.filter(m => m.officer === o.id);
                    const totalCases = cases.length;
                    const inWork = cases.filter(m => m.status !== 'закрыт_в_срок').length;
                    
                    let ratingColor = 'bg-gov-success';
                    let ratingText = 'text-gov-success';
                    if (o.index < 71) {
                      ratingColor = 'bg-gov-danger';
                      ratingText = 'text-gov-danger';
                    } else if (o.index < 86) {
                      ratingColor = 'bg-gov-warning';
                      ratingText = 'text-gov-warning';
                    }
                    
                    return (
                      <tr key={o.id} className="hover:bg-gov-light/30">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gov-text">{lang === 'ru' ? o.name_ru : o.name_uz}</p>
                          <p className="text-[10px] text-gov-muted mt-0.5 uppercase font-medium">{lang === 'ru' ? o.rank_ru : o.rank_uz}</p>
                        </td>
                        <td className="px-4 py-3 text-gov-muted uppercase tracking-wider font-bold text-[10px]">
                          {o.department === 'so' ? 'Tergov bo\'limi' : o.department === 'od' ? 'Surishtiruv bo\'limi' : 'Jinoyat qidiruv'}
                        </td>
                        <td className="px-4 py-3 font-bold text-gov-success">{o.likes}</td>
                        <td className="px-4 py-3 font-bold text-gov-danger">{o.dislikes}</td>
                        <td className="px-4 py-3 font-medium text-gov-text">{totalCases}</td>
                        <td className="px-4 py-3 font-medium text-gov-text">{inWork}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${ratingText}`}>{o.index}%</span>
                            <div className="w-16 bg-gov-border h-1.5 rounded overflow-hidden">
                              <div className={`${ratingColor} h-full`} style={{ width: `${o.index}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel 4: Approvals */}
        {activePanel === 'approvals' && (
          <div className="bg-white border border-gov-border rounded-lg p-6 shadow-sm">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              Согласование процессуальных решений следователей
            </h3>
            
            {approvalRequests.length === 0 ? (
              <div className="text-center py-12 text-gov-muted text-xs font-semibold">
                Запросов на согласование нет
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
                    <div key={req.id} className="border border-gov-border rounded-lg p-4 bg-gov-light/30 flex justify-between items-start gap-4 text-left">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gov-navy">{req.case}</span>
                          <span className="text-[10px] font-semibold text-gov-muted bg-white border border-gov-border px-1.5 py-0.5 rounded uppercase">
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-gov-text font-medium">
                          Следователь: <span className="font-semibold">{officer ? officer.name_ru : ''}</span>
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
    </div>
  );
}

export default ChiefView;
