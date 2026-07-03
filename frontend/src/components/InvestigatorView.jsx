import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend
);

function InvestigatorView({ lang, onViewDetails, user }) {
  const [activePanel, setActivePanel] = useState('dashboard'); // dashboard, materials, ai, history
  const [officer, setOfficer] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  
  // Filter States
  const [dateRange, setDateRange] = useState('all');
  const [difficulty, setDifficulty] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [sourceFrom, setSourceFrom] = useState('');

  // AI Chat States
  const [aiChat, setAiChat] = useState([
    {
      sender: 'ai',
      text: lang === 'ru' 
        ? 'Приветствую! Я ваш интеллектуальный правовой ассистент АИС «Е-Материал».\n\nЯ могу помочь вам:\n- Проверить дело на коллизионность норм права.\n- Сформировать список необходимых следственных действий.\n- Подготовить проект постановления.'
        : 'Assalomu alaykum! Men sizning «E-Material» intellektual huquqiy yordamchingizman.\n\nSizga yordam bera olaman:\n- Ishni qonunchilik normalariga muvofiqligini tekshirish.\n- Zaruriy tergov harakatlari ro\'yxatini tuzish.\n- Qaror loyihasini tayyorlash.'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [selectedCaseForAi, setSelectedCaseForAi] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiDraftResolution, setAiDraftResolution] = useState('');

  // Close Case Modal States
  const [closeCaseId, setCloseCaseId] = useState(null);
  const [decisionType, setDecisionType] = useState('закрыт_в_срок'); // закрыт_в_срок, возбуждено, перенаправлено
  const [closeReason, setCloseReason] = useState('');
  const [closeCaseNum, setCloseCaseNum] = useState('');
  const [closeOrgName, setCloseOrgName] = useState('');

  const CURRENT_OFFICER_ID = user?.id || 'off_karimov';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get(`${API_BASE}/officers/${CURRENT_OFFICER_ID}/`)
      .then(res => setOfficer(res.data));

    axios.get(`${API_BASE}/materials/`)
      .then(res => {
        // Filter only assigned to this investigator
        const myCases = res.data.filter(m => m.officer === CURRENT_OFFICER_ID);
        setMaterials(myCases);
        buildHistoryTimeline(myCases);
      });
  };

  const handleInlineStatusChange = (caseId, newStatus) => {
    axios.patch(`${API_BASE}/materials/${caseId}/`, { status: newStatus })
      .then(() => fetchData())
      .catch(err => console.error('Status update failed:', err));
  };

  const buildHistoryTimeline = (cases) => {
    let steps = [];
    cases.forEach(c => {
      if (c.appeals && c.appeals.length > 0) {
        c.appeals.forEach(a => {
          steps.push({
            caseId: c.id,
            citizenName: c.citizen_name,
            status: a.status,
            time: a.time
          });
        });
      }
    });
    // Sort descending by time
    steps.sort((a, b) => new Date(b.time) - new Date(a.time));
    setHistoryTimeline(steps);
  };

  // Filtered cases
  const filteredCases = materials.filter(c => {
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

  // Calculate stats
  const totalCases = materials.length;
  const closedCases = materials.filter(m => m.status === 'закрыт_в_срок').length;
  const activeCases = materials.filter(m => m.status !== 'закрыт_в_срок').length;
  const overdueCases = materials.filter(m => m.status === 'срок_нарушен').length;
  const newCases = materials.filter(m => {
    const d = new Date(m.registered_at);
    const now = new Date();
    return (now - d) < (86400000 * 3);
  }).length;

  const calculateDeadlines = () => {
    const offsets = { today: 0, tomorrow: 0, indinga: 0 };
    const now = new Date();
    const dStr = (offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d.toISOString().substring(0, 10);
    };
    
    filteredCases.forEach(m => {
      if (m.status === 'закрыт_в_срок') return;
      const dl = new Date(m.deadline).toISOString().substring(0,10);
      if (dl === dStr(0)) offsets.today++;
      else if (dl === dStr(1)) offsets.tomorrow++;
      else if (dl === dStr(2)) offsets.indinga++;
    });
    return offsets;
  };

  const dl = calculateDeadlines();

  const handleAiSend = (textInput) => {
    const query = textInput || aiInput;
    if (!query.trim()) return;

    setAiChat(prev => [...prev, { sender: 'user', text: query }]);
    setAiInput('');

    axios.post(`${API_BASE}/ai/chat/`, { query, lang })
      .then(res => {
        setAiChat(prev => [...prev, { sender: 'ai', text: res.data.aiText }]);
        setAiRecommendations(res.data.checklist || []);
        setAiDraftResolution(res.data.draftText || '');
      })
      .catch(err => console.error(err));
  };

  const handleTemplateAi = (type) => {
    let query = "";
    if (type === 'qual') {
      query = lang === 'ru' 
        ? "Разграничение кражи (ст. 169 УК РУз) и мошенничества (ст. 168 УК РУз) при транзакциях с карты" 
        : "Karta orqali pul o'tkazishda o'g'rilik (JK 169-modda) va firibgarlik (JK 168-modda) huquqiy farqlari";
    } else if (type === 'checklist') {
      query = lang === 'ru' 
        ? "План проверочных действий по заявлению о квартирной краже" 
        : "Xonadon o'g'riligi bo'yicha tergov-tekshiruv harakatlari rejasi";
    } else if (type === 'reject') {
      query = lang === 'ru' 
        ? "Подготовь черновик отказа в возбуждении уголовного дела по краже за отсутствием состава" 
        : "Jinoyat tarkibi yo'qligi sababli o'g'rilik bo'yicha jinoyat ishini qo'zg'atishni rad etish qarori loyihasini tayyorlash";
    }
    handleAiSend(query);
  };

  const handleLoadAiContext = (caseId) => {
    setSelectedCaseForAi(caseId);
    setActivePanel('ai');
    
    const mat = materials.find(m => m.id === caseId);
    const summary = lang === 'ru' ? mat.title_ru : mat.title_uz;
    
    setAiChat(prev => [...prev, { 
      sender: 'ai', 
      text: lang === 'ru' 
        ? `Загружен контекст дела **${caseId}**:\n"${summary}"\n\nЯ готов проанализировать состав, составить список проверочных мероприятий или подготовить проект постановления.`
        : `**${caseId}** ishi bo'yicha ma'lumotlar yuklandi:\n"${summary}"\n\nMen jinoyat tarkibini tahlil qilish, tekshiruv harakatlari ro'yxatini tuzish yoki qaror loyihasini tayyorlashga tayyorman.`
    }]);
  };

  const handleDecisionSubmit = (e) => {
    e.preventDefault();
    const payload = {
      caseId: closeCaseId,
      officerId: CURRENT_OFFICER_ID,
      type: decisionType,
      reason: closeReason,
      caseNum: closeCaseNum,
      orgName: closeOrgName
    };

    axios.post(`${API_BASE}/approvals/submit/`, payload)
      .then(() => {
        alert(lang === 'ru' ? 'Решение отправлено на согласование!' : 'Qaror tasdiqlash uchun yuborildi!');
        setCloseCaseId(null);
        setCloseReason('');
        setCloseCaseNum('');
        setCloseOrgName('');
        fetchData();
      })
      .catch(err => console.error(err));
  };

  // Setup Charts Data
  const getDinamikaData = () => {
    const datesMap = {};
    filteredCases.forEach(c => {
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

  const getDifficultyData = () => {
    const counts = [0, 0, 0, 0, 0];
    filteredCases.forEach(c => {
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

  const getTypesData = () => {
    const counts = { ariza: 0, bildirgi: 0, sud_ajrimi: 0, boshqa: 0 };
    filteredCases.forEach(c => {
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

  const getSourcesData = () => {
    const counts = { tashrif: 0, prakuratura: 0, prezident_aparat: 0, iio: 0, portal: 0 };
    filteredCases.forEach(c => {
      const s = c.source_from || 'tashrif';
      if (counts[s] !== undefined) counts[s]++;
    });
    return {
      labels: lang === 'ru' ? ["Лично", "Прокуратура", "Аппарат През.", "ИИО", "Портал"] : ["Qabulxona", "Prokuratura", "Prezident ap.", "IIO", "Portal"],
      datasets: [{
        label: lang === 'ru' ? 'Материалов' : 'Hujjatlar',
        data: [counts.tashrif, counts.prakuratura, counts.prezident_aparat, counts.iio, counts.portal],
        backgroundColor: '#0b132b'
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
      {/* Sidebar navigation */}
      <nav className="w-full md:w-64 bg-white border border-gov-border rounded-lg p-4 shadow-sm space-y-1 shrink-0 text-left">
        <div className="p-3 border-b border-gov-border mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gov-navy text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {officer ? officer.photo : 'КС'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-xs text-gov-text truncate">
                {officer ? (lang === 'ru' ? officer.name_ru : officer.name_uz) : ''}
              </h4>
              <p className="text-[10px] text-gov-muted mt-0.5 truncate uppercase tracking-wider font-bold">
                {officer ? (lang === 'ru' ? officer.rank_ru : officer.rank_uz) : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5">Меню</div>
        <button
          onClick={() => setActivePanel('dashboard')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-3 ${
            activePanel === 'dashboard' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <span>📊</span> {lang === 'ru' ? 'Главная' : 'Bosh sahifa'}
        </button>
        <button
          onClick={() => setActivePanel('materials')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex justify-between items-center ${
            activePanel === 'materials' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>📁</span> {lang === 'ru' ? 'Материалы' : 'Materiallar'}
          </div>
          <span className="bg-gov-blue/10 text-gov-blue px-2 py-0.5 rounded text-[10px] font-bold">
            {activeCases}
          </span>
        </button>
        <button
          onClick={() => setActivePanel('ai')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-3 ${
            activePanel === 'ai' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <span>🤖</span> {lang === 'ru' ? 'AI Ассистент' : 'AI Assistent'}
        </button>
        <button
          onClick={() => setActivePanel('history')}
          className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-3 ${
            activePanel === 'history' ? 'bg-gov-light text-gov-navy' : 'text-gov-muted hover:bg-gov-light/30 hover:text-gov-text'
          }`}
        >
          <span>🕒</span> {lang === 'ru' ? 'История' : 'Tarix'}
        </button>

        <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5 pt-6">Статус</div>
        <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
          <span>{lang === 'ru' ? 'Исполнено' : 'Bajarildi'}:</span>
          <span className="font-bold text-gov-success">{closedCases}</span>
        </div>
        <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
          <span>{lang === 'ru' ? 'Просрочено' : 'Muddati o\'tdi'}:</span>
          <span className="font-bold text-gov-danger">{overdueCases}</span>
        </div>
      </nav>

      {/* Main Panel Content */}
      <div className="flex-1 w-full space-y-6">
        
        {(activePanel === 'dashboard' || activePanel === 'materials') && (
          <div className="bg-white border border-gov-border rounded-lg p-5 shadow-sm text-left space-y-3">
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text">
              {lang === 'ru' ? 'Фильтры аналитики' : 'Tahlil filtrlari'}
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
            {/* Stat Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-muted">
                <p className="text-xl font-bold text-gov-text">{totalCases}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Барча материаллар</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-blue">
                <p className="text-xl font-bold text-gov-blue">{newCases}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Янги материаллар</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-warning">
                <p className="text-xl font-bold text-gov-warning">{activeCases}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Ижродаги материаллар</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-success">
                <p className="text-xl font-bold text-gov-success">{closedCases}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Бажарилган</p>
              </div>
              <div className="bg-white border border-gov-border p-4 rounded-lg shadow-sm text-left border-t-2 border-t-gov-danger col-span-2 md:col-span-1">
                <p className="text-xl font-bold text-gov-danger">{overdueCases}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gov-muted mt-1">Муддати бузилган</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm">
                <h5 className="font-semibold text-xs text-gov-text uppercase tracking-wider mb-4 text-left">Динамика регистрации</h5>
                <div className="h-64">
                  <Line data={getDinamikaData()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm">
                <h5 className="font-semibold text-xs text-gov-text uppercase tracking-wider mb-4 text-left">Распределение по сложности</h5>
                <div className="h-64 flex justify-center">
                  <Doughnut data={getDifficultyData()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm">
                <h5 className="font-semibold text-xs text-gov-text uppercase tracking-wider mb-4 text-left">Типы материалов</h5>
                <div className="h-64 flex justify-center">
                  <Pie data={getTypesData()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white border border-gov-border p-5 rounded-lg shadow-sm">
                <h5 className="font-semibold text-xs text-gov-text uppercase tracking-wider mb-4 text-left">Источники поступления</h5>
                <div className="h-64">
                  <Bar data={getSourcesData()} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Materials */}
        {activePanel === 'materials' && (
          <div className="bg-white border border-gov-border rounded-lg p-6 shadow-sm">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              Мои материалы доследственной проверки
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Заявитель</th>
                    <th className="px-4 py-3">Содержание обращения</th>
                    <th className="px-4 py-3">Срок исполнения</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-gov-muted font-medium">Материалов нет</td>
                    </tr>
                  ) : (
                    filteredCases.map(c => (
                      <tr key={c.id} className="hover:bg-gov-light/30">
                        <td className="px-4 py-3 font-semibold text-gov-text">{c.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gov-text">{c.citizen_name}</p>
                          <p className="text-[10px] text-gov-muted mt-0.5">{c.citizen_phone}</p>
                        </td>
                        <td className="px-4 py-3 text-gov-muted max-w-xs truncate" title={lang === 'ru' ? c.title_ru : c.title_uz}>
                          {lang === 'ru' ? c.title_ru : c.title_uz}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gov-text">{formatDate(c.deadline)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={c.status}
                            onChange={e => handleInlineStatusChange(c.id, e.target.value)}
                            className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none cursor-pointer focus:outline-none ${getStatusBadge(c.status)}`}
                          >
                            <option value="изучаемый">{lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda'}</option>
                            <option value="срок_приближается">{lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda'}</option>
                            <option value="срок_нарушен">{lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan'}</option>
                            <option value="закрыт_в_срок">{lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi'}</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => onViewDetails(c.id)}
                              className="px-2 py-1 bg-gov-light border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors text-[10px] font-bold"
                              title="Details"
                            >
                              👁
                            </button>
                            {c.status !== 'закрыт_в_срок' && (
                              <>
                                <button
                                  onClick={() => handleLoadAiContext(c.id)}
                                  className="px-2 py-1 bg-gov-blue/10 border border-gov-blue/20 text-gov-blue rounded hover:bg-gov-blue/20 transition-colors text-[10px] font-bold"
                                  title="AI Assistant"
                                >
                                  🤖
                                </button>
                                <button
                                  onClick={() => setCloseCaseId(c.id)}
                                  className="px-2 py-1 bg-gov-success/15 border border-gov-success/20 text-gov-success rounded hover:bg-gov-success/25 transition-colors text-[10px] font-bold"
                                  title="Procesual Decision"
                                >
                                  ⚖
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel 3: AI Legal Assistant */}
        {activePanel === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Chat Column */}
            <div className="lg:col-span-2 bg-white border border-gov-border rounded-lg p-5 shadow-sm flex flex-col h-[550px]">
              <div className="border-b border-gov-border pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text">
                  AI Правовой Ассистент
                </h3>
                <span className="px-2 py-0.5 border border-gov-border bg-gov-light text-gov-text text-[9px] font-bold rounded">
                  E-Material AI v1.2
                </span>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-4 p-2 text-xs border border-gov-border rounded bg-gov-light/30">
                {aiChat.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] p-3 rounded-lg border text-left leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-gov-navy text-white border-transparent self-end ml-auto' 
                        : 'bg-white text-gov-text border-gov-border self-start'
                    }`}
                  >
                    <span className="whitespace-pre-line">{m.text}</span>
                  </div>
                ))}
              </div>

              {/* Templates */}
              <div className="flex flex-wrap gap-2 my-4">
                <button onClick={() => handleTemplateAi('qual')} className="px-3 py-1.5 border border-gov-border hover:bg-gov-light rounded text-[10px] font-bold text-gov-muted hover:text-gov-text transition-colors">
                  Кража vs Мошенничество
                </button>
                <button onClick={() => handleTemplateAi('checklist')} className="px-3 py-1.5 border border-gov-border hover:bg-gov-light rounded text-[10px] font-bold text-gov-muted hover:text-gov-text transition-colors">
                  План действий по краже
                </button>
                <button onClick={() => handleTemplateAi('reject')} className="px-3 py-1.5 border border-gov-border hover:bg-gov-light rounded text-[10px] font-bold text-gov-muted hover:text-gov-text transition-colors">
                  Черновик Отказа в ВУД
                </button>
              </div>

              {/* Inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                  placeholder="Задайте правовой вопрос..."
                  className="flex-1 px-3 py-2 border border-gov-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-gov-blue/50 focus:border-gov-blue"
                />
                <button 
                  onClick={() => handleAiSend()}
                  className="px-4 py-2 bg-gov-navy text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-gov-slate"
                >
                  ➤
                </button>
              </div>
            </div>

            {/* Results Column Right */}
            <div className="lg:col-span-1 bg-white border border-gov-border rounded-lg p-5 shadow-sm space-y-4 text-left h-[550px] overflow-y-auto">
              <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-3">
                Аналитика и черновик документа
              </h4>
              
              {aiRecommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Рекомендуемые действия:</p>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-gov-text">
                    {aiRecommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiDraftResolution && (
                <div className="space-y-2 pt-2 border-t border-gov-border">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Проект постановления:</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiDraftResolution);
                        alert(lang === 'ru' ? 'Скопировано!' : 'Nusxalandi!');
                      }}
                      className="px-2 py-1 border border-gov-border bg-gov-light text-gov-text text-[9px] font-semibold rounded hover:bg-gov-border/30 transition-colors uppercase"
                    >
                      Копировать
                    </button>
                  </div>
                  <pre className="p-3 border border-gov-border bg-gov-light/35 rounded text-[10px] font-mono whitespace-pre-wrap leading-normal h-64 overflow-y-auto">
                    {aiDraftResolution}
                  </pre>
                </div>
              )}

              {!aiDraftResolution && aiRecommendations.length === 0 && (
                <div className="text-center py-24 text-gov-muted text-xs font-semibold">
                  Нет активного контекста
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel 4: History */}
        {activePanel === 'history' && (
          <div className="bg-white border border-gov-border rounded-lg p-6 shadow-sm">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              История действий по делам
            </h3>
            <div className="space-y-4 text-left max-w-2xl">
              {historyTimeline.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start relative pb-4 border-l border-gov-border pl-6 last:pb-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-gov-blue absolute -left-[5.5px] top-1.5 border border-white" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gov-text">
                      {item.caseId} — {item.status}
                    </p>
                    <p className="text-[10px] text-gov-muted font-medium">
                      {formatDate(item.time)} | {item.citizenName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Decision Submission Dialog Modal */}
      {closeCaseId && (
        <div className="fixed inset-0 z-[110] bg-gov-navy/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-gov-border rounded-lg max-w-md w-full p-6 shadow-lg text-left space-y-4">
            <div className="flex justify-between items-center border-b border-gov-border pb-3">
              <h3 className="font-display font-semibold text-sm text-gov-text uppercase tracking-wider">
                Принятие процессуального решения
              </h3>
              <button onClick={() => setCloseCaseId(null)} className="text-gov-muted hover:text-gov-text text-lg">×</button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  Тип процессуального решения
                </label>
                <select
                  value={decisionType}
                  onChange={e => setDecisionType(e.target.value)}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none"
                >
                  <option value="закрыт_в_срок">Отказ в возбуждении уголовного дела</option>
                  <option value="возбуждено">Возбуждение уголовного дела (ВУД)</option>
                  <option value="перенаправлено">Направление по территориальности/подследственности</option>
                </select>
              </div>

              {decisionType === 'возбуждено' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    Номер возбужденного уголовного дела
                  </label>
                  <input
                    type="text"
                    required
                    value={closeCaseNum}
                    onChange={e => setCloseCaseNum(e.target.value)}
                    placeholder="10/26-88"
                    className="w-full text-xs p-2 border border-gov-border rounded focus:outline-none"
                  />
                </div>
              )}

              {decisionType === 'перенаправлено' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    Куда перенаправлено (Орган)
                  </label>
                  <input
                    type="text"
                    required
                    value={closeOrgName}
                    onChange={e => setCloseOrgName(e.target.value)}
                    placeholder="УВД Юнусабадского района"
                    className="w-full text-xs p-2 border border-gov-border rounded focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  Процессуальное обоснование
                </label>
                <textarea
                  required
                  rows={3}
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  placeholder="В ходе доследственной проверки установлено..."
                  className="w-full text-xs p-2 border border-gov-border rounded resize-none focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gov-border">
                <button
                  type="button"
                  onClick={() => setCloseCaseId(null)}
                  className="px-4 py-2 border border-gov-border text-gov-text text-xs rounded hover:bg-gov-light"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy text-white text-xs font-semibold rounded hover:bg-gov-slate uppercase tracking-wider border border-transparent"
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestigatorView;
