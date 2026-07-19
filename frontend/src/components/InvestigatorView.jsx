import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import ChatPanel from './ChatPanel';
import SmsModal from './SmsModal';
import RatingsModal from './RatingsModal';
import { DashboardIcon, FolderIcon, AiIcon, ClockIcon, ChatIcon, TrendUpIcon, EyeIcon, ScaleIcon, SendIcon, CloseIcon, SearchIcon, GearIcon } from './Icons';
import Modal from './Modal';
import Card, { CardHeader } from './ui/Card';
import StatCard from './ui/StatCard';
import SidebarLink from './ui/SidebarLink';
import Avatar from './ui/Avatar';
import FilterPill from './ui/FilterPill';
import Select from './ui/Select';
import ExportButton from './ui/ExportButton';
import { exportToExcel } from '../exportExcel';
import { notify } from '../toastService';
import { MATERIAL_TYPES, ALL_SOURCES } from '../materialTaxonomy';

const MONTH_NAMES_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTH_NAMES_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function InvestigatorView({ lang, onViewDetails, user, onOpenSettings, sidebarOpen, onCloseSidebar }) {
  const [activePanel, setActivePanel] = useState('dashboard'); // dashboard, materials, ai, history
  const [materialsList, setMaterialsList] = useState(null); // { label, materials }
  const [officer, setOfficer] = useState(null);
  const [ratingsModalIsLike, setRatingsModalIsLike] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [smsModalCaseId, setSmsModalCaseId] = useState(null);
  const [approvalRequests, setApprovalRequests] = useState([]);

  // Filter States
  const [dateRange, setDateRange] = useState('all');
  const [monthFilter, setMonthFilter] = useState(''); // 'YYYY-MM' or ''
  const [difficulty, setDifficulty] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [sourceFrom, setSourceFrom] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickStatusGroup, setQuickStatusGroup] = useState(''); // '', 'new', 'active', 'closed', 'overdue' — set by dashboard stat-card clicks
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // '' | 'closest'
  const [materialsPage, setMaterialsPage] = useState(1);
  const MATERIALS_PAGE_SIZE = 20;

  // AI Chat States
  const [aiChat, setAiChat] = useState([
    {
      sender: 'ai',
      text: lang === 'ru' 
        ? 'Приветствую! Я ваш интеллектуальный правовой ассистент.\n\nЯ могу помочь вам:\n- Проверить дело на коллизионность норм права.\n- Сформировать список необходимых следственных действий.\n- Подготовить проект постановления.'
        : 'Assalomu alaykum! Men sizning intellektual huquqiy yordamchingizman.\n\nSizga yordam bera olaman:\n- Ishni qonunchilik normalariga muvofiqligini tekshirish.\n- Zaruriy tergov harakatlari ro\'yxatini tuzish.\n- Qaror loyihasini tayyorlash.'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
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

  const fetchUnreadChat = () => {
    axios.get(`${API_BASE}/chat/messages/unread_count/`, { params: { user_id: CURRENT_OFFICER_ID } })
      .then(res => setUnreadChat(res.data.count))
      .catch(err => console.error('Failed to load unread chat count', err));
  };

  useEffect(() => {
    fetchUnreadChat();
    const interval = setInterval(fetchUnreadChat, 20000);
    return () => clearInterval(interval);
  }, [CURRENT_OFFICER_ID]);

  // Opening the chat panel marks messages as read server-side; refresh the badge shortly after
  useEffect(() => {
    if (activePanel === 'chat') {
      const t = setTimeout(fetchUnreadChat, 1000);
      return () => clearTimeout(t);
    }
  }, [activePanel]);

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

    axios.get(`${API_BASE}/approvals/`)
      .then(res => setApprovalRequests(res.data));
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
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = `${c.id} ${c.citizen_name} ${c.citizen_phone}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (monthFilter) {
      if (c.registered_at.substring(0, 7) !== monthFilter) return false;
    } else if (dateRange !== 'all') {
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
    if (statusFilter && c.status !== statusFilter) return false;
    if (quickStatusGroup === 'new') {
      const d = new Date(c.registered_at);
      if ((new Date() - d) >= 86400000 * 3) return false;
    } else if (quickStatusGroup === 'active' && c.status === 'закрыт_в_срок') return false;
    else if (quickStatusGroup === 'closed' && c.status !== 'закрыт_в_срок') return false;
    else if (quickStatusGroup === 'overdue' && c.status !== 'срок_нарушен') return false;
    return true;
  });

  if (sortOrder === 'closest') {
    filteredCases.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  const materialsPageCount = Math.max(1, Math.ceil(filteredCases.length / MATERIALS_PAGE_SIZE));
  const pagedCases = filteredCases.slice((materialsPage - 1) * MATERIALS_PAGE_SIZE, materialsPage * MATERIALS_PAGE_SIZE);

  useEffect(() => {
    setMaterialsPage(1);
  }, [searchQuery, dateRange, monthFilter, difficulty, materialType, sourceFrom, statusFilter, quickStatusGroup, sortOrder]);

  useEffect(() => {
    if (materialsPage > materialsPageCount) setMaterialsPage(materialsPageCount);
  }, [materialsPageCount]);

  // Months present in the data, newest first, for the specific-month filter
  const monthOptions = Array.from(new Set(materials.map(m => m.registered_at.substring(0, 7))))
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const [y, mo] = key.split('-').map(Number);
      const name = lang === 'ru' ? MONTH_NAMES_RU[mo - 1] : MONTH_NAMES_UZ[mo - 1];
      return { value: key, label: `${name} ${y}` };
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

  const materialsByType = (list, type) => list.filter(m => (m.material_type || 'e_material') === type);

  const goToMaterials = (group = '') => {
    setDateRange('all'); setMonthFilter(''); setDifficulty(''); setMaterialType('');
    setSourceFrom(''); setStatusFilter(''); setSortOrder(''); setSearchQuery('');
    setQuickStatusGroup(group);
    setActivePanel('materials');
  };

  const calculateDeadlines = (list) => {
    const buckets = { today: [], tomorrow: [], indinga: [], days3: [], days4: [], days5: [], sl1: [], sl2: [], sl3: [], sl4: [], sl5: [] };
    const now = new Date();
    const dStr = (offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d.toISOString().substring(0, 10);
    };

    list.forEach(m => {
      if (m.status === 'закрыт_в_срок') return;
      const dl = new Date(m.deadline).toISOString().substring(0,10);
      if (dl === dStr(0)) buckets.today.push(m);
      else if (dl === dStr(1)) buckets.tomorrow.push(m);
      else if (dl === dStr(2)) buckets.indinga.push(m);
      else if (dl === dStr(3)) buckets.days3.push(m);
      else if (dl === dStr(4)) buckets.days4.push(m);
      else if (dl === dStr(5)) buckets.days5.push(m);
      else if (dl === dStr(6)) buckets.sl1.push(m);
      else if (dl === dStr(7)) buckets.sl2.push(m);
      else if (dl === dStr(8)) buckets.sl3.push(m);
      else if (dl === dStr(9)) buckets.sl4.push(m);
      else if (dl === dStr(10)) buckets.sl5.push(m);
    });
    return buckets;
  };

  const dlBucketsByType = Object.fromEntries(MATERIAL_TYPES.map(t => [t.value, calculateDeadlines(materialsByType(filteredCases, t.value))]));
  const dlByType = Object.fromEntries(MATERIAL_TYPES.map(t => [t.value, Object.fromEntries(Object.entries(dlBucketsByType[t.value]).map(([k, v]) => [k, v.length]))]));

  const openMaterialsList = (label, materials) => {
    if (!materials || materials.length === 0) return;
    setMaterialsList({ label, materials });
  };

  const openDeadlineBucket = (typeValue, key, label) => openMaterialsList(label, dlBucketsByType[typeValue][key]);

  const difficultyCounts = { simple: 0, medium: 0, hard: 0 };
  filteredCases.forEach(c => {
    if (c.difficulty <= 2) difficultyCounts.simple++;
    else if (c.difficulty === 3) difficultyCounts.medium++;
    else difficultyCounts.hard++;
  });

  // Trailing daily-count series for stat card sparklines / hero chart
  const getTrend = (matchFn, daysCount = 7) => {
    const days = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().substring(0, 10));
    }
    return days.map(day => materials.filter(m => m.registered_at.substring(0, 10) === day && matchFn(m)).length);
  };

  const trendTotal = getTrend(() => true);
  const trendActive = getTrend(m => m.status !== 'закрыт_в_срок');
  const trendClosed = getTrend(m => m.status === 'закрыт_в_срок');
  const trendOverdue = getTrend(m => m.status === 'срок_нарушен');

  const buildCaseContext = (mat) => {
    if (!mat) return null;
    return {
      id: mat.id,
      title_ru: mat.title_ru,
      title_uz: mat.title_uz,
      citizen_name: mat.citizen_name,
      iib: mat.iib,
      preliminary_article: mat.preliminary_article,
      material_type: mat.material_type,
      source_from: mat.source_from,
      status: mat.status,
      difficulty: mat.difficulty,
    };
  };

  const sendAiQuery = (query, caseContext) => {
    setAiThinking(true);
    axios.post(`${API_BASE}/ai/chat/`, { query, lang, case_context: caseContext })
      .then(res => {
        setAiChat(prev => [...prev, { sender: 'ai', text: res.data.aiText }]);
        setAiRecommendations(res.data.checklist || []);
        setAiDraftResolution(res.data.draftText || '');
      })
      .catch(err => console.error(err))
      .finally(() => setAiThinking(false));
  };

  const handleAiSend = (textInput) => {
    const query = textInput || aiInput;
    if (!query.trim() || aiThinking) return;

    setAiChat(prev => [...prev, { sender: 'user', text: query }]);
    setAiInput('');

    const mat = selectedCaseForAi ? materials.find(m => m.id === selectedCaseForAi) : null;
    sendAiQuery(query, buildCaseContext(mat));
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
    if (!mat) return;
    const summary = lang === 'ru' ? mat.title_ru : mat.title_uz;

    setAiChat(prev => [...prev, {
      sender: 'ai',
      text: lang === 'ru'
        ? `Загружен контекст дела **${caseId}**:\n"${summary}"\n\nАнализирую дело...`
        : `**${caseId}** ishi bo'yicha ma'lumotlar yuklandi:\n"${summary}"\n\nIsh tahlil qilinmoqda...`
    }]);

    const query = lang === 'ru'
      ? 'Проанализируй дело: определи квалификацию, дай список проверочных действий и, при необходимости, черновик постановления.'
      : "Ishni tahlil qiling: kvalifikatsiyani aniqlang, tekshiruv harakatlari ro'yxatini bering va zarur bo'lsa qaror loyihasini tayyorlang.";

    sendAiQuery(query, buildCaseContext(mat));
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
        notify(lang === 'ru' ? 'Решение отправлено на согласование!' : 'Qaror tasdiqlash uchun yuborildi!', 'success');
        setCloseCaseId(null);
        setCloseReason('');
        setCloseCaseNum('');
        setCloseOrgName('');
        fetchData();
      })
      .catch(err => {
        console.error(err);
        notify(
          err.response?.data?.error || (lang === 'ru' ? 'Ошибка при отправке решения' : 'Qarorni yuborishda xatolik'),
          'error'
        );
      });
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

  const handleExportMaterials = () => {
    exportToExcel(
      lang === 'ru' ? 'moi_materialy' : 'mening_materiallarim',
      ['ID', lang === 'ru' ? 'Заявитель' : 'Murojaatchi', lang === 'ru' ? 'Телефон' : 'Telefon', lang === 'ru' ? 'Содержание' : 'Mazmuni', 'ИИБ', lang === 'ru' ? 'Ст. УК' : 'Modda', lang === 'ru' ? 'Срок' : 'Muddat', lang === 'ru' ? 'Статус' : 'Holat', lang === 'ru' ? 'Тип' : 'Turi', lang === 'ru' ? 'Источник' : 'Manba', lang === 'ru' ? 'Сложность' : 'Murakkablik'],
      filteredCases.map(m => [
        m.id,
        m.citizen_name,
        m.citizen_phone,
        lang === 'ru' ? m.title_ru : m.title_uz,
        m.iib || '',
        m.preliminary_article || '',
        formatDate(m.deadline),
        getStatusText(m.status),
        m.material_type,
        m.source_from,
        m.difficulty,
      ])
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      {/* Backdrop, mobile/tablet only, while the drawer is open */}
      {sidebarOpen && (
        <div
          onClick={onCloseSidebar}
          className="fixed inset-0 bg-gov-navy/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar navigation */}
      <nav
        onClick={() => onCloseSidebar && onCloseSidebar()}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gov-surface shadow-2xl p-4 text-left overflow-y-auto flex flex-col transform transition-transform duration-300
          lg:translate-x-0 lg:z-40 lg:w-64 lg:shadow-none lg:border-r lg:border-gov-border
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between p-3 border-b border-gov-border mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={officer?.avatar} initials={officer ? officer.photo : 'КС'} />
              <div className="min-w-0">
                <h4 className="font-semibold text-xs text-gov-text leading-snug">
                  {officer ? (lang === 'ru' ? officer.name_ru : officer.name_uz) : ''}
                </h4>
                <p className="text-[10px] text-gov-muted mt-0.5 uppercase tracking-wider font-bold">
                  {officer ? (lang === 'ru' ? officer.rank_ru : officer.rank_uz) : ''}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseSidebar && onCloseSidebar(); }}
              className="lg:hidden p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all shrink-0"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5">{lang === 'ru' ? 'Меню' : 'Menyu'}</div>
          <SidebarLink
            icon={<DashboardIcon />}
            label={lang === 'ru' ? 'Главная' : 'Bosh sahifa'}
            active={activePanel === 'dashboard'}
            onClick={() => setActivePanel('dashboard')}
          />
          <SidebarLink
            icon={<FolderIcon />}
            label={lang === 'ru' ? 'Материалы' : 'Materiallar'}
            active={activePanel === 'materials'}
            onClick={() => setActivePanel('materials')}
            count={activeCases}
          />
          <SidebarLink
            icon={<AiIcon />}
            label={lang === 'ru' ? 'AI Ассистент' : 'AI Assistent'}
            active={activePanel === 'ai'}
            onClick={() => setActivePanel('ai')}
          />
          <SidebarLink
            icon={<ClockIcon />}
            label={lang === 'ru' ? 'История' : 'Tarix'}
            active={activePanel === 'history'}
            onClick={() => setActivePanel('history')}
          />
          <SidebarLink
            icon={<ChatIcon />}
            label={lang === 'ru' ? 'Чат' : 'Chat'}
            active={activePanel === 'chat'}
            onClick={() => setActivePanel('chat')}
            count={unreadChat}
          />
        </div>

        <div className="md:mt-auto md:pt-6">
          <SidebarLink
            icon={<GearIcon />}
            label={lang === 'ru' ? 'Настройки' : 'Sozlamalar'}
            active={false}
            onClick={onOpenSettings}
          />
          <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5 mt-2">{lang === 'ru' ? 'Статус' : 'Holat'}</div>
          <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
            <span>{lang === 'ru' ? 'Исполнено' : 'Bajarildi'}:</span>
            <span className="font-bold text-gov-success">{closedCases}</span>
          </div>
          <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
            <span>{lang === 'ru' ? 'Просрочено' : 'Muddati o\'tdi'}:</span>
            <span className="font-bold text-gov-danger">{overdueCases}</span>
          </div>
        </div>
      </nav>

      {/* Main Panel Content */}
      <div className="flex-1 w-full min-w-0 space-y-6 lg:ml-64">
        
        {activePanel === 'materials' && (
          <div className="relative max-w-sm">
            <SearchIcon className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gov-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск по ID, имени или телефону...' : 'ID, ism yoki telefon bo\'yicha qidirish...'}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gov-border rounded bg-gov-surface focus:outline-none focus:ring-2 focus:ring-gov-primary/30"
            />
          </div>
        )}

        {(activePanel === 'dashboard' || activePanel === 'materials') && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-gov-muted text-xs font-semibold pr-1">
              <FolderIcon className="h-3.5 w-3.5" /> {lang === 'ru' ? 'Фильтры:' : 'Filtrlar:'}
            </span>
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
              value={difficulty}
              defaultValue=""
              onChange={e => setDifficulty(e.target.value)}
              options={[
                { value: '', label: lang === 'ru' ? 'Сложность: все' : 'Murakkablik: barchasi' },
                { value: '1', label: lang === 'ru' ? 'Сложность 1' : 'Murakkablik 1' },
                { value: '2', label: lang === 'ru' ? 'Сложность 2' : 'Murakkablik 2' },
                { value: '3', label: lang === 'ru' ? 'Сложность 3' : 'Murakkablik 3' },
                { value: '4', label: lang === 'ru' ? 'Сложность 4' : 'Murakkablik 4' },
                { value: '5', label: lang === 'ru' ? 'Сложность 5' : 'Murakkablik 5' },
              ]}
            />
            <FilterPill
              value={materialType}
              defaultValue=""
              onChange={e => setMaterialType(e.target.value)}
              options={[
                { value: '', label: lang === 'ru' ? 'Все типы' : 'Barcha turlar' },
                ...MATERIAL_TYPES.map(t => ({ value: t.value, label: lang === 'ru' ? t.ru : t.uz })),
              ]}
            />
            <FilterPill
              value={sourceFrom}
              defaultValue=""
              onChange={e => setSourceFrom(e.target.value)}
              options={[
                { value: '', label: lang === 'ru' ? 'Все источники' : 'Barcha manbalar' },
                ...ALL_SOURCES.map(s => ({ value: s.value, label: lang === 'ru' ? s.ru : s.uz })),
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
            <FilterPill
              icon={<TrendUpIcon className="h-3.5 w-3.5" />}
              value={sortOrder}
              defaultValue=""
              onChange={e => setSortOrder(e.target.value)}
              options={[
                { value: '', label: lang === 'ru' ? 'Сортировка: по умолчанию' : 'Saralash: standart' },
                { value: 'closest', label: lang === 'ru' ? 'Ближайший срок' : 'Yaqin muddat' },
              ]}
            />
            {(dateRange !== 'all' || monthFilter || difficulty || materialType || sourceFrom || statusFilter || quickStatusGroup || sortOrder || searchQuery) && (
              <button
                onClick={() => { setDateRange('all'); setMonthFilter(''); setDifficulty(''); setMaterialType(''); setSourceFrom(''); setStatusFilter(''); setQuickStatusGroup(''); setSortOrder(''); setSearchQuery(''); }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gov-danger hover:bg-rose-50 rounded-full px-3 py-2 transition-colors"
              >
                <CloseIcon className="h-3.5 w-3.5" /> {lang === 'ru' ? 'Сбросить' : 'Tozalash'}
              </button>
            )}
          </div>
        )}

        {/* Panel 1: Dashboard */}
        {activePanel === 'dashboard' && (
          <div className="space-y-6">
            {/* Stat Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={<FolderIcon />} tone="primary" value={totalCases} label={lang === 'ru' ? 'Всего материалов' : 'Jami materiallar'} trend={trendTotal} onClick={() => goToMaterials('')} />
              <StatCard icon={<TrendUpIcon />} tone="info" value={newCases} label={lang === 'ru' ? 'Новые' : 'Yangi'} trend={trendTotal} onClick={() => goToMaterials('new')} />
              <StatCard icon={<ClockIcon />} tone="warning" value={activeCases} label={lang === 'ru' ? 'В производстве' : 'Ijroda'} trend={trendActive} onClick={() => goToMaterials('active')} />
              <StatCard icon={<DashboardIcon />} tone="success" value={closedCases} label={lang === 'ru' ? 'Исполнено' : 'Bajarildi'} trend={trendClosed} onClick={() => goToMaterials('closed')} />
              <StatCard icon={<ClockIcon />} tone="danger" value={overdueCases} label={lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'} trend={trendOverdue} onClick={() => goToMaterials('overdue')} />
              <StatCard icon={<ScaleIcon />} tone="info" value={`${officer ? officer.index : 0}%`} label={lang === 'ru' ? 'Индекс граждан' : 'Fuqarolar indeksi'} className="col-span-2 md:col-span-1" />
            </div>

            {/* Table 1: overall status counters */}
            <div className="bg-gov-surface rounded-2xl shadow-card p-5 text-left">
              <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                <DashboardIcon /> {lang === 'ru' ? 'Статус материалов' : 'Materiallar holati'}
              </h4>
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-3 py-2">{lang === 'ru' ? 'ТИП ДОКУМЕНТА' : 'HUJJAT TURI'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'ВСЕГО' : 'JAMI'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'В РАБОТЕ' : 'IJRODA'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'ИСПОЛНЕНО' : 'BAJARILDI'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'ПРОСРОЧЕНО' : 'MUDDATI O\'TGAN'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'ИНДЕКС %' : 'INDEKS %'}</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gov-border">
                  {MATERIAL_TYPES.map(t => {
                    const typeMaterials = materialsByType(materials, t.value);
                    const typeTotal = typeMaterials.length;
                    const typeActive = typeMaterials.filter(m => m.status !== 'закрыт_в_срок').length;
                    const typeClosed = typeMaterials.filter(m => m.status === 'закрыт_в_срок').length;
                    const typeOverdue = typeMaterials.filter(m => m.status === 'срок_нарушен').length;
                    const typeLabel = lang === 'ru' ? t.ru : t.uz;
                    return (
                      <tr key={t.value} className="hover:bg-gov-light/30">
                        <td className="px-3 py-3 font-semibold text-gov-text">{typeLabel}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => openMaterialsList(typeLabel, typeMaterials)} className="font-bold text-gov-text text-sm hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={typeTotal === 0}>{typeTotal}</button>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => openMaterialsList(`${typeLabel}: ${lang === 'ru' ? 'В производстве' : 'Ijroda'}`, typeMaterials.filter(m => m.status !== 'закрыт_в_срок'))} className="font-semibold text-gov-text text-sm hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={typeActive === 0}>{typeActive}</button>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => openMaterialsList(`${typeLabel}: ${lang === 'ru' ? 'Исполнено' : 'Bajarildi'}`, typeMaterials.filter(m => m.status === 'закрыт_в_срок'))} className="font-semibold text-gov-success text-sm hover:opacity-70 transition-opacity disabled:opacity-40" disabled={typeClosed === 0}>{typeClosed}</button>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => openMaterialsList(`${typeLabel}: ${lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}`, typeMaterials.filter(m => m.status === 'срок_нарушен'))}
                            disabled={typeOverdue === 0}
                            className={typeOverdue > 0 ? 'font-bold text-gov-danger bg-rose-50 px-2 py-0.5 rounded text-sm hover:bg-rose-100 transition-colors' : 'text-gov-muted text-sm disabled:opacity-40'}
                          >
                            {typeOverdue}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded bg-gov-blue/10 text-gov-blue font-bold text-sm">{officer ? officer.index : 0}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-gov-muted">
                {lang === 'ru' ? 'Сложность документов:' : 'Hujjatlar murakkabligi:'}{' '}
                {lang === 'ru' ? 'Простые (1-2)' : 'Oddiy (1-2)'}: <b className="text-gov-text">{difficultyCounts.simple}</b>
                {' | '}{lang === 'ru' ? 'Средние (3)' : 'O\'rtacha (3)'}: <b className="text-gov-text">{difficultyCounts.medium}</b>
                {' | '}{lang === 'ru' ? 'Сложные (4-5)' : 'Murakkab (4-5)'}: <b className="text-gov-text">{difficultyCounts.hard}</b>
              </p>
            </div>

            {/* Table 2: deadline breakdown by day */}
            <div className="bg-gov-surface rounded-2xl shadow-card p-5 text-left">
              <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                <ClockIcon /> {lang === 'ru' ? 'Сроки по дням' : 'Kunlar bo\'yicha muddatlar'}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gov-border text-left">
                  <thead>
                    <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                      <th className="px-3 py-2">{lang === 'ru' ? 'ТИП ДОКУМЕНТА' : 'HUJJAT TURI'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'СЕГОДНЯ' : 'BUGUN'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'ЗАВТРА' : 'ERTAGA'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'ПОСЛЕЗАВТРА' : 'INDINGA'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? '3 ДНЯ' : '3 KUN'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? '4 ДНЯ' : '4 KUN'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? '5 ДНЕЙ' : '5 KUN'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'НЕД.1' : 'H.1'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'НЕД.2' : 'H.2'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'НЕД.3' : 'H.3'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'НЕД.4' : 'H.4'}</th>
                      <th className="px-3 py-2">{lang === 'ru' ? 'НЕД.5' : 'H.5'}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gov-border">
                    {MATERIAL_TYPES.map(t => {
                      const dl = dlByType[t.value];
                      const typeLabel = lang === 'ru' ? t.ru : t.uz;
                      const buckets = [
                        { key: 'today', ru: 'Сегодня', uz: 'Bugun', className: 'font-bold text-gov-danger bg-rose-50 px-2 py-0.5 rounded hover:bg-rose-100 transition-colors disabled:opacity-40' },
                        { key: 'tomorrow', ru: 'Завтра', uz: 'Ertaga', className: 'font-bold text-gov-warning bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors disabled:opacity-40' },
                        { key: 'indinga', ru: 'Послезавтра', uz: 'Indinga', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'days3', ru: '3 дня', uz: '3 kun', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'days4', ru: '4 дня', uz: '4 kun', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'days5', ru: '5 дней', uz: '5 kun', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'sl1', ru: 'Неделя 1', uz: 'H.1', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'sl2', ru: 'Неделя 2', uz: 'H.2', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'sl3', ru: 'Неделя 3', uz: 'H.3', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'sl4', ru: 'Неделя 4', uz: 'H.4', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                        { key: 'sl5', ru: 'Неделя 5', uz: 'H.5', className: 'font-semibold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text' },
                      ];
                      return (
                        <tr key={t.value} className="hover:bg-gov-light/30">
                          <td className="px-3 py-3 font-semibold text-gov-text">{typeLabel}</td>
                          {buckets.map(b => (
                            <td key={b.key} className="px-3 py-3">
                              <button
                                onClick={() => openDeadlineBucket(t.value, b.key, `${typeLabel}: ${lang === 'ru' ? b.ru : b.uz}`)}
                                className={dl[b.key] === 0 ? 'text-gov-muted text-xs disabled:opacity-40' : b.className}
                                disabled={dl[b.key] === 0}
                              >
                                {dl[b.key]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Personal rating stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard icon={<DashboardIcon />} tone="success" value={officer ? officer.likes : 0} label={lang === 'ru' ? 'Положительных отзывов' : 'Ijobiy baholar'} onClick={() => setRatingsModalIsLike(true)} />
              <StatCard icon={<ClockIcon />} tone="danger" value={officer ? officer.dislikes : 0} label={lang === 'ru' ? 'Отрицательных отзывов' : 'Salbiy baholar'} onClick={() => setRatingsModalIsLike(false)} />
              <StatCard icon={<TrendUpIcon />} tone="cyan" value={newCases} label={lang === 'ru' ? 'Новых за 3 дня' : 'So\'nggi 3 kunda yangi'} onClick={() => goToMaterials('new')} />
            </div>

            {/* Personal planning table: own active cases sorted by nearest deadline */}
            <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6 ">
              <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
                {lang === 'ru' ? 'Планирование: мои ближайшие сроки' : 'Rejalashtirish: eng yaqin muddatlar'}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gov-border text-left">
                  <thead>
                    <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Заявитель' : 'Murojaatchi'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Срок' : 'Muddat'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Осталось' : 'Qoldi'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Сложность' : 'Murakkablik'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gov-border text-xs">
                    {(() => {
                      const now = new Date();
                      const upcoming = filteredCases
                        .filter(c => c.status !== 'закрыт_в_срок')
                        .map(c => ({ ...c, daysLeft: Math.ceil((new Date(c.deadline) - now) / 86400000) }))
                        .sort((a, b) => a.daysLeft - b.daysLeft);

                      if (upcoming.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="px-4 py-12 text-center text-gov-muted font-medium">
                              {lang === 'ru' ? 'Нет активных материалов' : 'Faol materiallar yo\'q'}
                            </td>
                          </tr>
                        );
                      }

                      return upcoming.map(c => (
                        <tr key={c.id} className="hover:bg-gov-light/30 cursor-pointer" onClick={() => onViewDetails(c.id)}>
                          <td className="px-4 py-3 font-semibold text-gov-text">{c.id}</td>
                          <td className="px-4 py-3">{c.citizen_name}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-gov-text">{formatDate(c.deadline)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${c.daysLeft < 0 ? 'text-gov-danger' : c.daysLeft <= 1 ? 'text-gov-warning' : 'text-gov-text'}`}>
                              {c.daysLeft < 0
                                ? (lang === 'ru' ? `Просрочено на ${Math.abs(c.daysLeft)} дн.` : `${Math.abs(c.daysLeft)} kun kechikkan`)
                                : (lang === 'ru' ? `${c.daysLeft} дн.` : `${c.daysLeft} kun`)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{c.difficulty}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none ${getStatusBadge(c.status)}`}>
                              {getStatusText(c.status)}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Materials */}
        {activePanel === 'materials' && (
          <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6 ">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-6 gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-semibold text-base text-gov-text text-left">
                  {lang === 'ru' ? 'Мои материалы доследственной проверки' : 'Mening tekshiruv materiallarim'}
                </h3>
                {quickStatusGroup && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gov-primary bg-gov-primaryLight px-2.5 py-1 rounded-full">
                    {{
                      new: lang === 'ru' ? 'Новые' : 'Yangi',
                      active: lang === 'ru' ? 'В производстве' : 'Ijroda',
                      closed: lang === 'ru' ? 'Исполнено' : 'Bajarildi',
                      overdue: lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan',
                    }[quickStatusGroup]}
                    <button onClick={() => setQuickStatusGroup('')} className="hover:text-gov-danger">
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <ExportButton lang={lang} onClick={handleExportMaterials} />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Заявитель' : 'Murojaatchi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Содержание обращения' : 'Murojaat mazmuni'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Срок исполнения' : 'Bajarish muddati'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
                    <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Действия' : 'Amallar'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {pagedCases.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-gov-muted font-medium">{lang === 'ru' ? 'Материалов нет' : 'Materiallar yo\'q'}</td>
                    </tr>
                  ) : (
                    pagedCases.map(c => {
                      const isPending = approvalRequests.some(r => r.case === c.id);
                      return (
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
                          <Select
                            value={c.status}
                            onChange={val => handleInlineStatusChange(c.id, val)}
                            disabled={isPending}
                            className={`px-2 py-1.5 border rounded text-[10px] font-semibold leading-none w-auto ${getStatusBadge(c.status)}`}
                            options={[
                              { value: 'изучаемый', label: lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda' },
                              { value: 'срок_приближается', label: lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda' },
                              { value: 'срок_нарушен', label: lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan' },
                              { value: 'закрыт_в_срок', label: lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi' },
                            ]}
                          />
                          {isPending && (
                            <p className="text-[9px] font-semibold text-gov-warning mt-1">
                              {lang === 'ru' ? 'На согласовании' : 'Tasdiqlashda'}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => onViewDetails(c.id)}
                              className="p-1.5 bg-gov-border/20 border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors inline-flex"
                              title="Details"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => setSmsModalCaseId(c.id)}
                              className="p-1.5 bg-gov-primaryLight border border-gov-primary/20 text-gov-primary rounded hover:bg-blue-100 transition-colors inline-flex"
                              title={lang === 'ru' ? 'SMS-уведомление' : 'SMS-xabarnoma'}
                            >
                              <SendIcon />
                            </button>
                            {c.status !== 'закрыт_в_срок' && (
                              <>
                                <button
                                  onClick={() => handleLoadAiContext(c.id)}
                                  className="p-1.5 bg-gov-blue/10 border border-gov-blue/20 text-gov-blue rounded hover:bg-gov-blue/20 transition-colors inline-flex"
                                  title="AI Assistant"
                                >
                                  <AiIcon />
                                </button>
                                <button
                                  onClick={() => setCloseCaseId(c.id)}
                                  disabled={isPending}
                                  className="p-1.5 bg-gov-success/15 border border-gov-success/20 text-gov-success rounded hover:bg-gov-success/25 transition-colors inline-flex disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gov-success/15"
                                  title={isPending ? (lang === 'ru' ? 'Решение уже на согласовании' : 'Qaror allaqachon tasdiqlashda') : 'Procesual Decision'}
                                >
                                  <ScaleIcon />
                                </button>
                              </>
                            )}
                          </div>
                          <p className={`text-center text-[9px] font-semibold mt-1 ${c.citizen_notification_text ? 'text-gov-success' : 'text-gov-muted'}`}>
                            {c.citizen_notification_text
                              ? (lang === 'ru' ? '✓ SMS отправлено' : '✓ SMS yuborildi')
                              : (lang === 'ru' ? 'SMS не отправлено' : 'SMS yuborilmagan')}
                          </p>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredCases.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gov-border">
                <p className="text-[11px] text-gov-muted">
                  {lang === 'ru'
                    ? `Показано ${(materialsPage - 1) * MATERIALS_PAGE_SIZE + 1}–${Math.min(materialsPage * MATERIALS_PAGE_SIZE, filteredCases.length)} из ${filteredCases.length}`
                    : `${(materialsPage - 1) * MATERIALS_PAGE_SIZE + 1}–${Math.min(materialsPage * MATERIALS_PAGE_SIZE, filteredCases.length)} / ${filteredCases.length} ta ko'rsatilmoqda`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMaterialsPage(p => Math.max(1, p - 1))}
                    disabled={materialsPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold border border-gov-border rounded text-gov-text hover:bg-gov-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {lang === 'ru' ? 'Назад' : 'Oldingi'}
                  </button>
                  <span className="px-2 text-xs font-semibold text-gov-muted">
                    {materialsPage} / {materialsPageCount}
                  </span>
                  <button
                    onClick={() => setMaterialsPage(p => Math.min(materialsPageCount, p + 1))}
                    disabled={materialsPage === materialsPageCount}
                    className="px-3 py-1.5 text-xs font-semibold border border-gov-border rounded text-gov-text hover:bg-gov-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {lang === 'ru' ? 'Вперёд' : 'Keyingi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel 3: AI Legal Assistant */}
        {activePanel === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Chat Column */}
            <div className="lg:col-span-2 bg-gov-surface rounded-2xl shadow-card p-5 flex flex-col h-[700px]">
              <div className="border-b border-gov-border pb-3 mb-4">
                <h3 className="font-semibold text-sm text-gov-text">
                  {lang === 'ru' ? 'AI Правовой Ассистент' : 'AI Huquqiy Yordamchi'}
                </h3>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-4 p-2 text-xs border border-gov-border rounded bg-gov-light/30">
                {aiChat.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] p-3 rounded-lg border text-left leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-gov-primary text-white border-transparent self-end ml-auto' 
                        : 'bg-gov-surface text-gov-text border-gov-border self-start'
                    }`}
                  >
                    <span className="whitespace-pre-line">{m.text}</span>
                  </div>
                ))}
                {aiThinking && (
                  <div className="flex items-center gap-1.5 max-w-[85%] p-3 rounded-lg border border-gov-border bg-gov-surface text-gov-muted self-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-muted animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-muted animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-muted animate-bounce" />
                  </div>
                )}
              </div>

              {/* Templates */}
              <div className="flex flex-wrap gap-2 my-4">
                <button disabled={aiThinking} onClick={() => handleTemplateAi('qual')} className="px-3 py-1.5 border border-gov-border hover:bg-gov-light rounded text-[10px] font-bold text-gov-muted hover:text-gov-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {lang === 'ru' ? 'Кража vs Мошенничество' : 'O\'g\'irlik va firibgarlik'}
                </button>
                <button disabled={aiThinking} onClick={() => handleTemplateAi('checklist')} className="px-3 py-1.5 border border-gov-border hover:bg-gov-light rounded text-[10px] font-bold text-gov-muted hover:text-gov-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {lang === 'ru' ? 'План действий по краже' : 'O\'g\'irlik bo\'yicha reja'}
                </button>
                <button disabled={aiThinking} onClick={() => handleTemplateAi('reject')} className="px-3 py-1.5 border border-gov-border hover:bg-gov-light rounded text-[10px] font-bold text-gov-muted hover:text-gov-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {lang === 'ru' ? 'Черновик Отказа в ВУД' : 'JIQ rad etish loyihasi'}
                </button>
              </div>

              {/* Inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                  disabled={aiThinking}
                  placeholder={lang === 'ru' ? 'Задайте правовой вопрос...' : 'Huquqiy savol bering...'}
                  className="flex-1 px-3 py-2 border border-gov-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-gov-blue/50 focus:border-gov-blue disabled:opacity-60"
                />
                <button
                  onClick={() => handleAiSend()}
                  disabled={aiThinking}
                  className="px-4 py-2 bg-gov-primary text-white rounded-xl hover:bg-blue-700 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendIcon />
                </button>
              </div>
            </div>

            {/* Results Column Right */}
            <div className="lg:col-span-1 bg-gov-surface rounded-2xl shadow-card p-5 space-y-4 text-left h-[700px] overflow-y-auto">
              <h4 className="font-semibold text-sm text-gov-text border-b border-gov-border pb-3">
                {lang === 'ru' ? 'Аналитика и черновик документа' : 'Tahlil va hujjat loyihasi'}
              </h4>

              {aiRecommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Рекомендуемые действия:' : 'Tavsiya etilgan harakatlar:'}</p>
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
                    <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Проект постановления:' : 'Qaror loyihasi:'}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiDraftResolution);
                        notify(lang === 'ru' ? 'Скопировано!' : 'Nusxalandi!', 'success');
                      }}
                      className="px-2 py-1 border border-gov-border bg-gov-light text-gov-text text-[9px] font-semibold rounded hover:bg-gov-border/30 transition-colors uppercase"
                    >
                      {lang === 'ru' ? 'Копировать' : 'Nusxalash'}
                    </button>
                  </div>
                  <pre className="p-3 border border-gov-border bg-gov-light/35 rounded text-[10px] font-mono whitespace-pre-wrap leading-normal h-64 overflow-y-auto">
                    {aiDraftResolution}
                  </pre>
                </div>
              )}

              {!aiDraftResolution && aiRecommendations.length === 0 && (
                <div className="text-center py-24 text-gov-muted text-xs font-semibold">
                  {lang === 'ru' ? 'Нет активного контекста' : 'Faol kontekst yo\'q'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel 4: History */}
        {activePanel === 'history' && (
          <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6">
            <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              {lang === 'ru' ? 'История действий по делам' : 'Ishlar bo\'yicha harakatlar tarixi'}
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

        {/* Panel 5: Chat */}
        {activePanel === 'chat' && (
          <ChatPanel lang={lang} user={user} />
        )}
      </div>

      {/* Decision Submission Dialog Modal */}
      {closeCaseId && (
        <Modal onClose={() => setCloseCaseId(null)} maxWidth="max-w-md">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gov-border pb-3">
              <h3 className="font-display font-semibold text-sm text-gov-text uppercase tracking-wider">
                {lang === 'ru' ? 'Принятие процессуального решения' : 'Protsessual qaror qabul qilish'}
              </h3>
              <button onClick={() => setCloseCaseId(null)} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors"><CloseIcon className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                  {lang === 'ru' ? 'Тип процессуального решения' : 'Protsessual qaror turi'}
                </label>
                <Select
                  value={decisionType}
                  onChange={setDecisionType}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light"
                  options={[
                    { value: 'закрыт_в_срок', label: lang === 'ru' ? 'Отказ в возбуждении уголовного дела' : 'JIQni qo\'zg\'atishni rad etish' },
                    { value: 'возбуждено', label: lang === 'ru' ? 'Возбуждение уголовного дела (ВУД)' : 'JIQ qo\'zg\'atish' },
                    { value: 'перенаправлено', label: lang === 'ru' ? 'Направление по территориальности/подследственности' : 'Tegishlilik bo\'yicha yuborish' },
                  ]}
                />
              </div>

              {decisionType === 'возбуждено' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'Номер возбужденного уголовного дела' : 'Qo\'zg\'atilgan JIQ raqami'}
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
                    {lang === 'ru' ? 'Куда перенаправлено (Орган)' : 'Qayerga yuborildi (Organ)'}
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
                  {lang === 'ru' ? 'Процессуальное обоснование' : 'Protsessual asos'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  placeholder={lang === 'ru' ? 'В ходе доследственной проверки установлено...' : 'Tekshiruv davomida aniqlandi...'}
                  className="w-full text-xs p-2 border border-gov-border rounded resize-none focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gov-border">
                <button
                  type="button"
                  onClick={() => setCloseCaseId(null)}
                  className="px-4 py-2 border border-gov-border text-gov-text text-xs rounded hover:bg-gov-light"
                >
                  {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-primary text-white text-xs font-semibold rounded hover:bg-blue-700 border border-transparent"
                >
                  {lang === 'ru' ? 'Отправить' : 'Yuborish'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {materialsList && (
        <Modal onClose={() => setMaterialsList(null)} maxWidth="max-w-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gov-border">
              <h3 className="font-semibold text-base text-gov-text">
                {lang === 'ru' ? 'Срок:' : 'Muddat:'} {materialsList.label} · {materialsList.materials.length}
              </h3>
              <button onClick={() => setMaterialsList(null)} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors"><CloseIcon className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {materialsList.materials.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onViewDetails(m.id); setMaterialsList(null); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gov-light transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gov-primary">{m.id}</p>
                    <p className="text-xs text-gov-text truncate">{m.citizen_name}</p>
                  </div>
                  <EyeIcon className="h-4 w-4 text-gov-muted shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {smsModalCaseId && (
        <SmsModal
          caseId={smsModalCaseId}
          lang={lang}
          user={user}
          onClose={() => setSmsModalCaseId(null)}
          onSent={fetchData}
        />
      )}

      {ratingsModalIsLike !== null && officer && (
        <RatingsModal
          lang={lang}
          isLike={ratingsModalIsLike}
          officerIds={[officer.id]}
          hideCitizenName
          onClose={() => setRatingsModalIsLike(null)}
        />
      )}
    </div>
  );
}

export default InvestigatorView;
