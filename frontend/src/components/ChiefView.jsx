import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChatPanel from './ChatPanel';
import SmsModal from './SmsModal';
import RatingsModal from './RatingsModal';
import { CATEGORICAL, SEQUENTIAL, chartTheme } from '../chartColors';
import { useSettings } from '../settingsContext';
import { DashboardIcon, FolderIcon, UsersIcon, ApprovalIcon, KeyIcon, ChatIcon, EyeIcon, EyeOffIcon, ClockIcon, TrendUpIcon, CloseIcon, ThumbUpIcon, ThumbDownIcon, SendIcon, SearchIcon, GearIcon } from './Icons';
import Card, { CardHeader } from './ui/Card';
import StatCard from './ui/StatCard';
import SidebarLink from './ui/SidebarLink';
import Avatar from './ui/Avatar';
import FilterPill from './ui/FilterPill';
import HeroChartCard from './ui/HeroChartCard';
import PillBarChart from './ui/PillBarChart';
import Select from './ui/Select';
import Modal from './Modal';
import ExportButton from './ui/ExportButton';
import { exportToExcel } from '../exportExcel';
import { confirm } from '../confirmService';
import { notify } from '../toastService';
import { MATERIAL_TYPES, ALL_SOURCES } from '../materialTaxonomy';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const MONTH_NAMES_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTH_NAMES_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const MONTH_NAMES_SHORT_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const MONTH_NAMES_SHORT_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

function ChiefView({ lang, onViewDetails, user, onOpenSettings, sidebarOpen, onCloseSidebar }) {
  const { isDark } = useSettings();
  const { textColor, gridColor } = chartTheme(isDark);
  const [activePanel, setActivePanel] = useState('dashboard'); // dashboard, materials, ratings, approvals, users
  const [materialsList, setMaterialsList] = useState(null); // { label, materials }
  const [officers, setOfficers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [ratingsModal, setRatingsModal] = useState(null); // { officer, items }
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ content_ru: '', content_uz: '', trigger_ru: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const ROLE_LABELS = {
    registrator: { ru: 'Регистратор', uz: 'Registrator' },
    investigator: { ru: 'Следователь', uz: 'Tergovchi' },
    chief: { ru: 'Начальник', uz: 'Boshliq' }
  };

  const emptyNewUser = { username: '', name_ru: '', name_uz: '', rank_ru: '', rank_uz: '', role: 'investigator', password: '' };
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Filter States
  const [dateRange, setDateRange] = useState('all');
  const [monthFilter, setMonthFilter] = useState(''); // 'YYYY-MM' or ''
  const [difficulty, setDifficulty] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [sourceFrom, setSourceFrom] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickStatusGroup, setQuickStatusGroup] = useState(''); // '', 'new', 'active', 'closed', 'overdue' — set by dashboard stat-card clicks
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // '' | 'closest'
  const [materialsPage, setMaterialsPage] = useState(1);
  const MATERIALS_PAGE_SIZE = 20;
  const [smsModalCaseId, setSmsModalCaseId] = useState(null);
  const [ratingsModalIsLike, setRatingsModalIsLike] = useState(null); // null closed, true/false open filtered to that kind

  useEffect(() => {
    fetchData();
  }, []);

  const fetchUnreadChat = () => {
    axios.get(`${API_BASE}/chat/messages/unread_count/`, { params: { user_id: user?.id } })
      .then(res => setUnreadChat(res.data.count))
      .catch(err => console.error('Failed to load unread chat count', err));
  };

  useEffect(() => {
    fetchUnreadChat();
    const interval = setInterval(fetchUnreadChat, 20000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Opening the chat panel marks messages as read server-side; refresh the badge shortly after
  useEffect(() => {
    if (activePanel === 'chat') {
      const t = setTimeout(fetchUnreadChat, 1000);
      return () => clearTimeout(t);
    }
  }, [activePanel]);

  const fetchData = () => {
    axios.get(`${API_BASE}/officers/`)
      .then(res => setOfficers(res.data));

    axios.get(`${API_BASE}/materials/`)
      .then(res => setMaterials(res.data));

    axios.get(`${API_BASE}/approvals/`)
      .then(res => setApprovalRequests(res.data));

    axios.get(`${API_BASE}/templates/`)
      .then(res => setSmsTemplates(res.data));
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplate.content_ru.trim()) return;
    setSavingTemplate(true);
    axios.post(`${API_BASE}/templates/`, {
      template_id: `tpl_${Date.now()}`,
      type: 'SMS',
      trigger_ru: newTemplate.trigger_ru,
      trigger_uz: newTemplate.trigger_ru,
      content_ru: newTemplate.content_ru.trim(),
      content_uz: newTemplate.content_uz.trim(),
      created_by: user?.name || '',
    })
      .then(() => {
        setSavingTemplate(false);
        setTemplateModalOpen(false);
        setNewTemplate({ content_ru: '', content_uz: '', trigger_ru: '' });
        notify(lang === 'ru' ? 'Текст отправлен на модерацию!' : 'Matn moderatsiyaga yuborildi!', 'success');
        fetchData();
      })
      .catch(err => {
        console.error(err);
        setSavingTemplate(false);
        notify(lang === 'ru' ? 'Ошибка при добавлении текста' : 'Matnni qo\'shishda xatolik', 'error');
      });
  };

  const handleTemplateStatusChange = (templateId, patch) => {
    axios.patch(`${API_BASE}/templates/${templateId}/`, patch)
      .then(() => fetchData())
      .catch(err => {
        console.error(err);
        notify(lang === 'ru' ? 'Ошибка при обновлении статуса' : 'Statusni yangilashda xatolik', 'error');
      });
  };

  const handleDeleteTemplate = async (templateId) => {
    const ok = await confirm(lang === 'ru' ? 'Удалить этот текст?' : 'Ushbu matnni o\'chirasizmi?', { danger: true });
    if (!ok) return;
    axios.delete(`${API_BASE}/templates/${templateId}/`)
      .then(() => fetchData())
      .catch(() => notify(lang === 'ru' ? 'Ошибка удаления.' : 'O\'chirishda xatolik.', 'error'));
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const username = newUser.username.trim().toLowerCase();
    if (!username || !newUser.name_ru) {
      setCreateError(lang === 'ru' ? 'Заполните логин и ФИО!' : 'Login va F.I.Sh. kiriting!');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setCreateError(lang === 'ru' ? 'Логин может содержать только латинские буквы, цифры и "_"' : 'Login faqat lotin harflari, raqamlar va "_" dan iborat bo\'lishi kerak');
      return;
    }
    const password = newUser.password.trim();
    if (!password || password.length < 6) {
      setCreateError(lang === 'ru' ? 'Укажите пароль (минимум 6 символов)' : 'Parolni kiriting (kamida 6 ta belgi)');
      return;
    }

    const parts = newUser.name_ru.split(' ').filter(Boolean);
    const photo = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ? parts[0][0] : 'У');

    axios.post(`${API_BASE}/officers/`, {
      id: `off_${username}`,
      name_ru: newUser.name_ru,
      name_uz: newUser.name_uz || newUser.name_ru,
      rank_ru: newUser.rank_ru || '-',
      rank_uz: newUser.rank_uz || '-',
      role: newUser.role,
      password,
      photo
    }).then(() => {
      setCreateSuccess(
        lang === 'ru'
          ? `Пользователь "${username}" создан! Пароль: ${password}`
          : `"${username}" foydalanuvchisi yaratildi! Parol: ${password}`
      );
      setNewUser(emptyNewUser);
      fetchData();
    }).catch(err => {
      const idErr = err.response?.data?.id?.[0];
      const passwordErr = err.response?.data?.error;
      const msg = idErr
        ? (lang === 'ru' ? 'Такой логин уже занят.' : 'Bu login band.')
        : passwordErr || (lang === 'ru' ? 'Ошибка создания пользователя.' : 'Foydalanuvchi yaratishda xatolik.');
      setCreateError(msg);
    });
  };

  const handleDeleteUser = async (officerId) => {
    const ok = await confirm(lang === 'ru' ? 'Удалить пользователя?' : 'Foydalanuvchini o\'chirasizmi?', { danger: true });
    if (!ok) return;
    axios.delete(`${API_BASE}/officers/${officerId}/`)
      .then(() => fetchData())
      .catch(() => notify(lang === 'ru' ? 'Ошибка удаления.' : 'O\'chirishda xatolik.', 'error'));
  };

  // Filter materials
  const matchesNonDateFilters = (c) => {
    if (difficulty && c.difficulty != difficulty) return false;
    if (materialType && c.material_type !== materialType) return false;
    if (sourceFrom && c.source_from !== sourceFrom) return false;
    if (officerFilter && c.officer !== officerFilter) return false;
    return true;
  };

  const filteredMaterials = materials.filter(c => {
    if (!matchesNonDateFilters(c)) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (quickStatusGroup === 'new') {
      const d = new Date(c.registered_at);
      if ((new Date() - d) >= 86400000 * 3) return false;
    } else if (quickStatusGroup === 'active' && c.status === 'закрыт_в_срок') return false;
    else if (quickStatusGroup === 'closed' && c.status !== 'закрыт_в_срок') return false;
    else if (quickStatusGroup === 'overdue' && c.status !== 'срок_нарушен') return false;
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
    return true;
  });

  if (sortOrder === 'closest') {
    filteredMaterials.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  const materialsPageCount = Math.max(1, Math.ceil(filteredMaterials.length / MATERIALS_PAGE_SIZE));
  const pagedMaterials = filteredMaterials.slice((materialsPage - 1) * MATERIALS_PAGE_SIZE, materialsPage * MATERIALS_PAGE_SIZE);

  useEffect(() => {
    setMaterialsPage(1);
  }, [searchQuery, dateRange, monthFilter, difficulty, materialType, sourceFrom, officerFilter, statusFilter, quickStatusGroup, sortOrder]);

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

  const total = filteredMaterials.length;
  const newCount = filteredMaterials.filter(m => {
    const d = new Date(m.registered_at);
    const now = new Date();
    return (now - d) < (86400000 * 3);
  }).length;
  const activeCount = filteredMaterials.filter(m => m.status !== 'закрыт_в_срок').length;
  const closedCount = filteredMaterials.filter(m => m.status === 'закрыт_в_срок').length;
  const overdueCount = filteredMaterials.filter(m => m.status === 'срок_нарушен').length;

  const goToMaterials = (group = '') => {
    setDateRange('all'); setMonthFilter(''); setDifficulty(''); setMaterialType('');
    setSourceFrom(''); setOfficerFilter(''); setStatusFilter(''); setSortOrder(''); setSearchQuery('');
    setQuickStatusGroup(group);
    setActivePanel('materials');
  };

  const investigatorsList = officers.filter(o => o.role === 'investigator');
  const avgIndex = investigatorsList.length > 0
    ? Math.round(investigatorsList.reduce((sum, o) => sum + o.index, 0) / investigatorsList.length)
    : 0;
  const totalLikes = investigatorsList.reduce((sum, o) => sum + o.likes, 0);
  const totalDislikes = investigatorsList.reduce((sum, o) => sum + o.dislikes, 0);

  const difficultyCounts = { simple: 0, medium: 0, hard: 0 };
  filteredMaterials.forEach(c => {
    if (c.difficulty <= 2) difficultyCounts.simple++;
    else if (c.difficulty === 3) difficultyCounts.medium++;
    else difficultyCounts.hard++;
  });

  const materialsByType = (list, type) => list.filter(m => (m.material_type || 'e_material') === type);

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

  const dlBucketsByType = Object.fromEntries(MATERIAL_TYPES.map(t => [t.value, calculateDeadlines(materialsByType(filteredMaterials, t.value))]));
  const dlByType = Object.fromEntries(MATERIAL_TYPES.map(t => [t.value, Object.fromEntries(Object.entries(dlBucketsByType[t.value]).map(([k, v]) => [k, v.length]))]));

  const openMaterialsList = (label, materials) => {
    if (!materials || materials.length === 0) return;
    setMaterialsList({ label, materials });
  };

  const openDeadlineBucket = (typeValue, key, label) => openMaterialsList(label, dlBucketsByType[typeValue][key]);

  // Trailing daily-count series for stat card sparklines / hero chart
  const getTrend = (matchFn, daysCount = 7) => {
    const days = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().substring(0, 10));
    }
    return days.map(day => filteredMaterials.filter(m => m.registered_at.substring(0, 10) === day && matchFn(m)).length);
  };

  const trendTotal = getTrend(() => true);
  const trendNew = trendTotal;
  const trendActive = getTrend(m => m.status !== 'закрыт_в_срок');
  const trendClosed = getTrend(m => m.status === 'закрыт_в_срок');
  const trendOverdue = getTrend(m => m.status === 'срок_нарушен');

  const heroTrend = getTrend(() => true, 30);
  const heroFirstHalf = heroTrend.slice(0, 15).reduce((a, b) => a + b, 0);
  const heroSecondHalf = heroTrend.slice(15).reduce((a, b) => a + b, 0);
  const heroDelta = heroFirstHalf > 0 ? Math.round(((heroSecondHalf - heroFirstHalf) / heroFirstHalf) * 100) : (heroSecondHalf > 0 ? 100 : 0);
  const heroLabels = (() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(`${d.getDate()}.${d.getMonth() + 1}`);
    }
    return days;
  })();
  const heroChartData = {
    labels: heroLabels,
    datasets: [{
      label: lang === 'ru' ? 'Регистраций' : 'Ro\'yxatga olishlar',
      data: heroTrend,
      borderColor: CATEGORICAL[0],
      backgroundColor: 'rgba(42, 120, 214, 0.08)',
      tension: 0.35,
      fill: true,
      borderWidth: 2,
    }],
  };

  // Monthly analytics (last 6 calendar months, respects officer/difficulty/type/source filters but not the date filters)
  const monthlyBaseMaterials = materials.filter(matchesNonDateFilters);
  const monthlyStats = (() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), monthIdx: d.getMonth(), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    }
    return months.map(m => {
      const items = monthlyBaseMaterials.filter(c => c.registered_at.substring(0, 7) === m.key);
      return {
        key: m.key,
        label: `${lang === 'ru' ? MONTH_NAMES_SHORT_RU[m.monthIdx] : MONTH_NAMES_SHORT_UZ[m.monthIdx]} ${m.year}`,
        total: items.length,
        closed: items.filter(c => c.status === 'закрыт_в_срок').length,
        overdue: items.filter(c => c.status === 'срок_нарушен').length,
      };
    });
  })();
  const monthlyChartData = {
    labels: monthlyStats.map(m => m.label),
    datasets: [
      { label: lang === 'ru' ? 'Всего' : 'Jami', data: monthlyStats.map(m => m.total), backgroundColor: CATEGORICAL[0], borderRadius: 4 },
      { label: lang === 'ru' ? 'Исполнено' : 'Bajarildi', data: monthlyStats.map(m => m.closed), backgroundColor: CATEGORICAL[1], borderRadius: 4 },
      { label: lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan', data: monthlyStats.map(m => m.overdue), backgroundColor: CATEGORICAL[4], borderRadius: 4 },
    ],
  };

  const handleReassign = (caseId, newOfficerId) => {
    if (!newOfficerId) return;
    axios.post(`${API_BASE}/materials/${caseId}/reassign/`, { new_officer_id: newOfficerId })
      .then(() => {
        notify(lang === 'ru' ? 'Исполнитель успешно изменен!' : 'Ijrochi muvaffaqiyatli o\'zgartirildi!', 'success');
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const handleApprove = (caseId) => {
    axios.post(`${API_BASE}/approvals/${caseId}/approve/`)
      .then(() => {
        notify(lang === 'ru' ? 'Решение успешно утверждено!' : 'Qaror muvaffaqiyatli tasdiqlandi!', 'success');
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const handleReject = (caseId) => {
    axios.post(`${API_BASE}/approvals/${caseId}/reject/`)
      .then(() => {
        notify(lang === 'ru' ? 'Решение отклонено!' : 'Qaror rad etildi!', 'info');
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const openOfficerRatings = (officer) => {
    setRatingsModal({ officer, items: [] });
    setRatingsLoading(true);
    axios.get(`${API_BASE}/officers/${officer.id}/ratings/`)
      .then(res => setRatingsModal({ officer, items: res.data }))
      .catch(err => console.error(err))
      .finally(() => setRatingsLoading(false));
  };

  const handleInlineStatusChange = (caseId, newStatus) => {
    axios.patch(`${API_BASE}/materials/${caseId}/`, { status: newStatus })
      .then(() => fetchData())
      .catch(err => console.error('Status update failed:', err));
  };

  // Charts
  const getOfficersRatingData = () => {
    const investigators = officers.filter(o => o.role === 'investigator');
    const names = investigators.map(o => lang === 'ru' ? o.name_ru.split(' ')[0] : o.name_uz.split(' ')[0]);
    const indices = investigators.map(o => o.index);
    return {
      labels: names,
      datasets: [{
        label: lang === 'ru' ? 'Индекс удовлетворенности %' : 'Mamnunlik indeksi %',
        data: indices,
        backgroundColor: CATEGORICAL[0],
        borderRadius: 4
      }]
    };
  };

  const getTypesBarData = () => {
    return MATERIAL_TYPES.map(t => ({
      label: lang === 'ru' ? t.ru : t.uz,
      value: filteredMaterials.filter(c => (c.material_type || 'e_material') === t.value).length,
    }));
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
        backgroundColor: [SEQUENTIAL[0], SEQUENTIAL[1], SEQUENTIAL[3], SEQUENTIAL[4], SEQUENTIAL[5]],
        borderWidth: 2,
        borderColor: '#ffffff'
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

  const getTemplateStatusBadge = (status) => {
    switch (status) {
      case 'одобрено':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'отказан':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'в_процессе':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getTemplateStatusText = (status) => {
    const map = {
      'на_модерации': lang === 'ru' ? 'На модерации' : 'Moderatsiyada',
      'в_процессе': lang === 'ru' ? 'В процессе' : 'Jarayonda',
      'одобрено': lang === 'ru' ? 'Одобрено' : 'Tasdiqlangan',
      'отказан': lang === 'ru' ? 'Отказан' : 'Rad etilgan',
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
      lang === 'ru' ? 'materialy' : 'materiallar',
      ['ID', lang === 'ru' ? 'Исполнитель' : 'Ijrochi', lang === 'ru' ? 'Заявитель' : 'Murojaatchi', lang === 'ru' ? 'Телефон' : 'Telefon', lang === 'ru' ? 'Содержание' : 'Mazmuni', 'ИИБ', lang === 'ru' ? 'Ст. УК' : 'Modda', lang === 'ru' ? 'Дата регистрации' : 'Ro\'yxatga olingan sana', lang === 'ru' ? 'Срок' : 'Muddat', lang === 'ru' ? 'Статус' : 'Holat', lang === 'ru' ? 'Тип' : 'Turi', lang === 'ru' ? 'Источник' : 'Manba', lang === 'ru' ? 'Сложность' : 'Murakkablik'],
      filteredMaterials.map(m => {
        const off = officers.find(o => o.id === m.officer);
        return [
          m.id,
          off ? (lang === 'ru' ? off.name_ru : off.name_uz) : '',
          m.citizen_name,
          m.citizen_phone,
          lang === 'ru' ? m.title_ru : m.title_uz,
          m.iib || '',
          m.preliminary_article || '',
          formatDate(m.registered_at),
          formatDate(m.deadline),
          getStatusText(m.status),
          m.material_type,
          m.source_from,
          m.difficulty,
        ];
      })
    );
  };

  const handleExportInvestigators = () => {
    exportToExcel(
      lang === 'ru' ? 'pokazateli_sledovateley' : 'tergovchilar_korsatkichlari',
      [
        lang === 'ru' ? 'Следователь' : 'Tergovchi', lang === 'ru' ? 'Всего' : 'Jami', lang === 'ru' ? 'В работе' : 'Ijroda',
        lang === 'ru' ? 'Исполнено' : 'Bajarildi', lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan', lang === 'ru' ? 'Новые' : 'Yangi',
        lang === 'ru' ? 'Сегодня' : 'Bugun', lang === 'ru' ? 'Простые' : 'Oddiy', lang === 'ru' ? 'Средние' : 'O\'rtacha',
        lang === 'ru' ? 'Сложные' : 'Murakkab', lang === 'ru' ? 'Ср. сложность' : 'O\'rt. murakkablik', 'Likes', 'Dislikes',
        lang === 'ru' ? 'Индекс %' : 'Indeks %',
      ],
      investigatorsList.map(o => {
        const cases = filteredMaterials.filter(m => m.officer === o.id);
        const active = cases.filter(m => m.status !== 'закрыт_в_срок').length;
        const closed = cases.filter(m => m.status === 'закрыт_в_срок').length;
        const overdue = cases.filter(m => m.status === 'срок_нарушен').length;
        const newOnes = cases.filter(m => (new Date() - new Date(m.registered_at)) < 86400000 * 3).length;
        const now = new Date();
        const dueToday = cases.filter(m => m.status !== 'закрыт_в_срок' && new Date(m.deadline).toISOString().substring(0,10) === now.toISOString().substring(0,10)).length;
        const simple = cases.filter(c => c.difficulty <= 2).length;
        const medium = cases.filter(c => c.difficulty === 3).length;
        const hard = cases.filter(c => c.difficulty >= 4).length;
        const avgDifficulty = cases.length > 0 ? (cases.reduce((sum, c) => sum + c.difficulty, 0) / cases.length).toFixed(1) : 0;
        return [
          lang === 'ru' ? o.name_ru : o.name_uz, cases.length, active, closed, overdue, newOnes, dueToday,
          simple, medium, hard, avgDifficulty, o.likes, o.dislikes, o.index,
        ];
      })
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

      {/* Sidebar Nav */}
      <nav
        onClick={() => onCloseSidebar && onCloseSidebar()}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gov-surface shadow-2xl p-4 text-left overflow-y-auto flex flex-col transform transition-transform duration-300
          lg:translate-x-0 lg:z-40 lg:w-64 lg:shadow-none lg:border-r lg:border-gov-border
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between p-3 border-b border-gov-border mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={user?.avatar} initials={user?.photo || (user?.name ? user.name[0] : 'М')} />
              <div className="min-w-0">
                <h4 className="font-semibold text-xs text-gov-text leading-snug">{user?.name || ''}</h4>
                <p className="text-[10px] text-gov-muted mt-0.5 uppercase tracking-wider font-bold">
                  {user?.roleLabel || (lang === 'ru' ? 'Начальник' : 'Boshliq')}
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

          <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5">{lang === 'ru' ? 'Разделы' : 'Bo\'limlar'}</div>
          <SidebarLink
            icon={<DashboardIcon />}
            label={lang === 'ru' ? 'Панель управления' : 'Boshqaruv paneli'}
            active={activePanel === 'dashboard'}
            onClick={() => setActivePanel('dashboard')}
          />
          <SidebarLink
            icon={<FolderIcon />}
            label={lang === 'ru' ? 'Все материалы' : 'Barcha materiallar'}
            active={activePanel === 'materials'}
            onClick={() => setActivePanel('materials')}
            count={materials.filter(m => m.status !== 'закрыт_в_срок').length}
          />
          <SidebarLink
            icon={<UsersIcon />}
            label={lang === 'ru' ? 'Рейтинг сотрудников' : 'Xodimlar reytingi'}
            active={activePanel === 'ratings'}
            onClick={() => setActivePanel('ratings')}
          />
          <SidebarLink
            icon={<ApprovalIcon />}
            label={lang === 'ru' ? 'Тасдиклаш' : 'Tasdiqlash'}
            active={activePanel === 'approvals'}
            onClick={() => setActivePanel('approvals')}
            count={approvalRequests.length}
          />
          <SidebarLink
            icon={<KeyIcon />}
            label={lang === 'ru' ? 'Пользователи' : 'Foydalanuvchilar'}
            active={activePanel === 'users'}
            onClick={() => setActivePanel('users')}
          />
          <SidebarLink
            icon={<ChatIcon />}
            label={lang === 'ru' ? 'Чат' : 'Chat'}
            active={activePanel === 'chat'}
            onClick={() => setActivePanel('chat')}
            count={unreadChat}
          />
          <SidebarLink
            icon={<SendIcon />}
            label={lang === 'ru' ? 'SMS шаблоны' : 'SMS shablonlar'}
            active={activePanel === 'sms'}
            onClick={() => setActivePanel('sms')}
            count={smsTemplates.filter(t => t.status === 'на_модерации').length}
          />
        </div>

        <div className="md:mt-auto md:pt-6">
          <SidebarLink
            icon={<GearIcon />}
            label={lang === 'ru' ? 'Настройки' : 'Sozlamalar'}
            active={false}
            onClick={onOpenSettings}
          />
          <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5 mt-2">{lang === 'ru' ? 'Сводка' : 'Xulosa'}</div>
          <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
            <span>{lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}:</span>
            <span className="font-bold text-gov-danger">{materials.filter(m => m.status === 'срок_нарушен').length}</span>
          </div>
          <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
            <span>{lang === 'ru' ? 'Истекает сегодня' : 'Bugun tugaydi'}:</span>
            <span className="font-bold text-gov-warning">{MATERIAL_TYPES.reduce((sum, t) => sum + dlByType[t.value].today, 0)}</span>
          </div>
        </div>
      </nav>

      {/* Content Area */}
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
              icon={<UsersIcon className="h-3.5 w-3.5" />}
              value={officerFilter}
              defaultValue=""
              onChange={e => setOfficerFilter(e.target.value)}
              options={[
                { value: '', label: lang === 'ru' ? 'Все следователи' : 'Barcha tergovchilar' },
                ...officers.filter(o => o.role === 'investigator').map(o => ({ value: o.id, label: lang === 'ru' ? o.name_ru : o.name_uz })),
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
            {(dateRange !== 'all' || monthFilter || difficulty || materialType || sourceFrom || officerFilter || statusFilter || quickStatusGroup || sortOrder || searchQuery) && (
              <button
                onClick={() => { setDateRange('all'); setMonthFilter(''); setDifficulty(''); setMaterialType(''); setSourceFrom(''); setOfficerFilter(''); setStatusFilter(''); setQuickStatusGroup(''); setSortOrder(''); setSearchQuery(''); }}
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
            {/* Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard icon={<FolderIcon />} tone="primary" value={total} label={lang === 'ru' ? 'Всего материалов' : 'Jami materiallar'} trend={trendTotal} onClick={() => goToMaterials('')} />
              <StatCard icon={<TrendUpIcon />} tone="info" value={newCount} label={lang === 'ru' ? 'Новые' : 'Yangi'} trend={trendNew} onClick={() => goToMaterials('new')} />
              <StatCard icon={<ClockIcon />} tone="warning" value={activeCount} label={lang === 'ru' ? 'В производстве' : 'Ijroda'} trend={trendActive} onClick={() => goToMaterials('active')} />
              <StatCard icon={<ApprovalIcon />} tone="success" value={closedCount} label={lang === 'ru' ? 'Исполнено' : 'Bajarildi'} trend={trendClosed} onClick={() => goToMaterials('closed')} />
              <StatCard icon={<ClockIcon />} tone="danger" value={overdueCount} label={lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'} trend={trendOverdue} className="col-span-2 md:col-span-1" onClick={() => goToMaterials('overdue')} />
            </div>

            {/* Secondary stat row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={<UsersIcon />} tone="cyan" value={officers.filter(o => o.role === 'investigator').length} label={lang === 'ru' ? 'Следователей' : 'Tergovchilar'} onClick={() => setActivePanel('ratings')} />
              <StatCard icon={<ApprovalIcon />} tone="warning" value={approvalRequests.length} label={lang === 'ru' ? 'На согласовании' : 'Tasdiqlashda'} onClick={() => setActivePanel('approvals')} />
              <StatCard icon={<TrendUpIcon />} tone="info" value={`${total > 0 ? Math.round((closedCount / total) * 100) : 0}%`} label={lang === 'ru' ? 'Доля исполненных' : 'Bajarilganlar ulushi'} onClick={() => goToMaterials('closed')} />
            </div>

            {/* Hero chart + type breakdown, one row */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              <div className="flex-1 min-w-0">
                <HeroChartCard
                  title={lang === 'ru' ? 'Динамика регистрации' : 'Ro\'yxatga olish dinamikasi'}
                  value={total}
                  delta={heroDelta}
                  caption={lang === 'ru' ? 'за 30 дней' : '30 kunda'}
                  data={heroChartData}
                  breakdown={[
                    { icon: <UsersIcon className="h-3.5 w-3.5" />, value: investigatorsList.length, label: lang === 'ru' ? 'Следователей' : 'Tergovchilar', color: CATEGORICAL[0] },
                    { icon: <ApprovalIcon className="h-3.5 w-3.5" />, value: approvalRequests.length, label: lang === 'ru' ? 'На согласовании' : 'Tasdiqlashda', color: CATEGORICAL[1] },
                  ]}
                />
              </div>
              <div className="w-full lg:w-[30%] shrink-0">
                <PillBarChart title={lang === 'ru' ? 'Типы материалов' : 'Material turlari'} data={getTypesBarData()} />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gov-surface rounded-2xl shadow-card p-5">
                <h5 className="font-semibold text-sm text-gov-text mb-4 text-left">{lang === 'ru' ? 'Рейтинг следователей, %' : 'Tergovchilar reytingi, %'}</h5>
                <div className="h-64">
                  <Bar
                    data={getOfficersRatingData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { min: 0, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
                        x: { ticks: { color: textColor }, grid: { color: gridColor } },
                      },
                      plugins: { legend: { labels: { color: textColor } } },
                    }}
                  />
                </div>
              </div>

              <div className="bg-gov-surface rounded-2xl shadow-card p-5">
                <h5 className="font-semibold text-sm text-gov-text mb-4 text-left">{lang === 'ru' ? 'Распределение по сложности' : 'Murakkablik bo\'yicha taqsimot'}</h5>
                <div className="h-64 flex justify-center">
                  <Doughnut
                    data={getDifficultyData()}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } } }}
                  />
                </div>
              </div>
            </div>

            {/* Monthly analytics */}
            <div className="bg-gov-surface rounded-2xl shadow-card p-5">
              <h5 className="font-semibold text-sm text-gov-text mb-4 text-left">{lang === 'ru' ? 'Аналитика по месяцам' : 'Oylar bo\'yicha tahlil'}</h5>
              <div className="h-72">
                <Bar
                  data={monthlyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0, color: textColor }, grid: { color: gridColor } },
                      x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    },
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: textColor } } },
                  }}
                />
              </div>
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
                    <th className="px-3 py-2">{lang === 'ru' ? 'СР. ИНДЕКС %' : 'O\'RT. INDEKS %'}</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gov-border">
                  {MATERIAL_TYPES.map(t => {
                    const typeMaterials = materialsByType(filteredMaterials, t.value);
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
                          <button onClick={() => openMaterialsList(`${typeLabel}: ${lang === 'ru' ? 'В работе' : 'Ijroda'}`, typeMaterials.filter(m => m.status !== 'закрыт_в_срок'))} className="font-semibold text-gov-text text-sm hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={typeActive === 0}>{typeActive}</button>
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
                          <span className="px-2 py-0.5 rounded bg-gov-blue/10 text-gov-blue font-bold text-sm">{avgIndex}%</span>
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

            {/* Overall rating stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard icon={<ApprovalIcon />} tone="success" value={totalLikes} label={lang === 'ru' ? 'Положительных отзывов' : 'Ijobiy baholar'} onClick={() => setRatingsModalIsLike(true)} />
              <StatCard icon={<ClockIcon />} tone="danger" value={totalDislikes} label={lang === 'ru' ? 'Отрицательных отзывов' : 'Salbiy baholar'} onClick={() => setRatingsModalIsLike(false)} />
              <StatCard icon={<TrendUpIcon />} tone="cyan" value={newCount} label={lang === 'ru' ? 'Новых за 3 дня' : 'So\'nggi 3 kunda yangi'} onClick={() => goToMaterials('new')} />
            </div>

            {/* Approvals queue */}
            <Card>
              <CardHeader icon={<ApprovalIcon />} title={lang === 'ru' ? 'Очередь согласования решений' : 'Qarorlarni tasdiqlash navbati'} />
              <div className="grid grid-cols-2 gap-4 text-xs">
                <button
                  onClick={() => setActivePanel('approvals')}
                  disabled={approvalRequests.length === 0}
                  className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex justify-between items-center text-gov-danger hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-50"
                >
                  <span>{lang === 'ru' ? 'Ожидают решения' : 'Qaror kutilmoqda'}</span>
                  <strong className="text-sm font-bold">{approvalRequests.length}</strong>
                </button>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-gov-warning">
                  <span>{lang === 'ru' ? 'Продление сроков' : 'Muddat uzaytirish'}</span>
                  <strong className="text-sm font-bold">0</strong>
                </div>
              </div>
            </Card>

            {/* Per-investigator stats table */}
            <div className="bg-gov-surface rounded-2xl shadow-card p-5 text-left">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm text-gov-text flex items-center gap-2">
                  <UsersIcon /> {lang === 'ru' ? 'Показатели следователей' : 'Tergovchilar ko\'rsatkichlari'}
                </h4>
                <ExportButton lang={lang} onClick={handleExportInvestigators} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gov-border text-left">
                  <thead>
                    <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                      <th className="px-4 py-2">{lang === 'ru' ? 'Следователь' : 'Tergovchi'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Всего' : 'Jami'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'В работе' : 'Ijroda'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Исполнено' : 'Bajarildi'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Новые' : 'Yangi'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Сегодня' : 'Bugun'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Простые' : 'Oddiy'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Средние' : 'O\'rtacha'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Сложные' : 'Murakkab'}</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Ср. сложность' : 'O\'rt. murakkablik'}</th>
                      <th className="px-4 py-2">Likes</th>
                      <th className="px-4 py-2">Dislikes</th>
                      <th className="px-4 py-2">{lang === 'ru' ? 'Индекс %' : 'Indeks %'}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gov-border">
                    {investigatorsList.map(o => {
                      const cases = filteredMaterials.filter(m => m.officer === o.id);
                      const active = cases.filter(m => m.status !== 'закрыт_в_срок').length;
                      const closed = cases.filter(m => m.status === 'закрыт_в_срок').length;
                      const overdue = cases.filter(m => m.status === 'срок_нарушен').length;
                      const newOnes = cases.filter(m => (new Date() - new Date(m.registered_at)) < 86400000 * 3).length;
                      const now = new Date();
                      const dueToday = cases.filter(m => m.status !== 'закрыт_в_срок' && new Date(m.deadline).toISOString().substring(0,10) === now.toISOString().substring(0,10)).length;
                      const simple = cases.filter(c => c.difficulty <= 2).length;
                      const medium = cases.filter(c => c.difficulty === 3).length;
                      const hard = cases.filter(c => c.difficulty >= 4).length;
                      const avgDifficulty = cases.length > 0 ? (cases.reduce((sum, c) => sum + c.difficulty, 0) / cases.length).toFixed(1) : '—';
                      const officerName = lang === 'ru' ? o.name_ru : o.name_uz;
                      return (
                        <tr key={o.id} className="hover:bg-gov-light/30">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gov-text">{officerName}</p>
                            <p className="text-[10px] text-gov-muted mt-0.5 uppercase font-medium">{lang === 'ru' ? o.rank_ru : o.rank_uz}</p>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Всего' : 'Jami'}`, cases)} className="font-bold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={cases.length === 0}>{cases.length}</button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'В работе' : 'Ijroda'}`, cases.filter(m => m.status !== 'закрыт_в_срок'))} className="text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={active === 0}>{active}</button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Исполнено' : 'Bajarildi'}`, cases.filter(m => m.status === 'закрыт_в_срок'))} className="text-gov-success hover:opacity-70 transition-opacity disabled:opacity-40" disabled={closed === 0}>{closed}</button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}`, cases.filter(m => m.status === 'срок_нарушен'))}
                              disabled={overdue === 0}
                              className={overdue > 0 ? 'font-bold text-gov-danger bg-rose-50 px-2 py-0.5 rounded hover:bg-rose-100 transition-colors' : 'text-gov-muted disabled:opacity-40'}
                            >
                              {overdue > 0 ? overdue : 0}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Новые' : 'Yangi'}`, cases.filter(m => (new Date() - new Date(m.registered_at)) < 86400000 * 3))} className="font-semibold text-gov-blue hover:opacity-70 transition-opacity disabled:opacity-40" disabled={newOnes === 0}>{newOnes}</button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Сегодня' : 'Bugun'}`, cases.filter(m => m.status !== 'закрыт_в_срок' && new Date(m.deadline).toISOString().substring(0,10) === now.toISOString().substring(0,10)))}
                              disabled={dueToday === 0}
                              className={dueToday > 0 ? 'font-bold text-gov-warning bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors' : 'text-gov-muted disabled:opacity-40'}
                            >
                              {dueToday > 0 ? dueToday : 0}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Простые' : 'Oddiy'}`, cases.filter(c => c.difficulty <= 2))} className="text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={simple === 0}>{simple}</button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Средние' : 'O\'rtacha'}`, cases.filter(c => c.difficulty === 3))} className="text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={medium === 0}>{medium}</button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openMaterialsList(`${officerName} — ${lang === 'ru' ? 'Сложные' : 'Murakkab'}`, cases.filter(c => c.difficulty >= 4))} className="text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={hard === 0}>{hard}</button>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gov-text">{avgDifficulty}</td>
                          <td className="px-4 py-3 font-bold text-gov-success">{o.likes}</td>
                          <td className="px-4 py-3 font-bold text-gov-danger">{o.dislikes}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-gov-blue/10 text-gov-blue font-bold">{o.index}%</span>
                          </td>
                        </tr>
                      );
                    })}
                    {investigatorsList.length === 0 && (
                      <tr>
                        <td colSpan="13" className="px-4 py-8 text-center text-gov-muted font-medium">
                          {lang === 'ru' ? 'Следователи не найдены' : 'Tergovchilar topilmadi'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Materials by type and source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gov-surface rounded-2xl shadow-card p-5 text-left">
                <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                  <FolderIcon /> {lang === 'ru' ? 'По типу материала' : 'Material turi bo\'yicha'}
                </h4>
                <table className="min-w-full divide-y divide-gov-border text-left text-xs">
                  <tbody className="divide-y divide-gov-border">
                    {MATERIAL_TYPES.map(t => {
                      const items = filteredMaterials.filter(m => (m.material_type || 'e_material') === t.value);
                      return (
                        <tr key={t.value} className="hover:bg-gov-light/30">
                          <td className="px-4 py-2.5 text-gov-text">{lang === 'ru' ? t.ru : t.uz}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button onClick={() => openMaterialsList(lang === 'ru' ? t.ru : t.uz, items)} className="font-bold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={items.length === 0}>{items.length}</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-gov-surface rounded-2xl shadow-card p-5 text-left">
                <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                  <TrendUpIcon /> {lang === 'ru' ? 'По источнику поступления' : 'Kelib tushish manbasi bo\'yicha'}
                </h4>
                <table className="min-w-full divide-y divide-gov-border text-left text-xs">
                  <tbody className="divide-y divide-gov-border">
                    {ALL_SOURCES.map(s => {
                      const items = filteredMaterials.filter(m => (m.source_from || 'e_material') === s.value);
                      return (
                        <tr key={s.value} className="hover:bg-gov-light/30">
                          <td className="px-4 py-2.5 text-gov-text">{lang === 'ru' ? s.ru : s.uz}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button onClick={() => openMaterialsList(lang === 'ru' ? s.ru : s.uz, items)} className="font-bold text-gov-text hover:text-gov-primary transition-colors disabled:opacity-40 disabled:hover:text-gov-text" disabled={items.length === 0}>{items.length}</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Panel 2: All Materials with Reassignments */}
        {activePanel === 'materials' && (
          <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-6 gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-semibold text-base text-gov-text text-left">
                  {lang === 'ru' ? 'Мониторинг всех материалов доследственной проверки' : 'Barcha tekshiruv materiallari monitoringi'}
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
                    <th className="px-4 py-3">{lang === 'ru' ? 'Исполнитель / Переназначить' : 'Ijrochi / Qayta biriktirish'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Заявитель' : 'Murojaatchi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Содержание' : 'Mazmuni'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Срок' : 'Muddat'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
                    <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Действия' : 'Amallar'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {pagedMaterials.map(c => {
                    const activeOff = officers.find(o => o.id === c.officer);
                    const activeName = activeOff ? activeOff.name_ru.split(' ')[0] : '';
                    const isPending = approvalRequests.some(r => r.case === c.id);

                    return (
                      <tr key={c.id} className="hover:bg-gov-light/30">
                        <td className="px-4 py-3 font-semibold text-gov-text">{c.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gov-text mb-1">{activeName}</p>
                          {c.status !== 'закрыт_в_срок' && (
                            <Select
                              value=""
                              onChange={(val) => handleReassign(c.id, val)}
                              className="text-[10px] p-1 border border-gov-border rounded bg-gov-light w-32"
                              placeholder={lang === 'ru' ? '-- Переназначить --' : '-- Qayta biriktirish --'}
                              options={officers.filter(o => o.role === 'investigator' && o.id !== c.officer).map(o => ({
                                value: o.id, label: o.name_ru.split(' ')[0]
                              }))}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">{c.citizen_name}</td>
                        <td className="px-4 py-3 text-gov-muted max-w-[150px] truncate" title={lang === 'ru' ? c.title_ru : c.title_uz}>
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
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => onViewDetails(c.id)}
                              className="p-1.5 bg-gov-border/20 border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors inline-flex"
                              title={lang === 'ru' ? 'Просмотр' : 'Ko\'rish'}
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
                          </div>
                          <p className={`text-center text-[9px] font-semibold mt-1 ${c.citizen_notification_text ? 'text-gov-success' : 'text-gov-muted'}`}>
                            {c.citizen_notification_text
                              ? (lang === 'ru' ? '✓ SMS отправлено' : '✓ SMS yuborildi')
                              : (lang === 'ru' ? 'SMS не отправлено' : 'SMS yuborilmagan')}
                          </p>
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
                    ? `Показано ${(materialsPage - 1) * MATERIALS_PAGE_SIZE + 1}–${Math.min(materialsPage * MATERIALS_PAGE_SIZE, filteredMaterials.length)} из ${filteredMaterials.length}`
                    : `${(materialsPage - 1) * MATERIALS_PAGE_SIZE + 1}–${Math.min(materialsPage * MATERIALS_PAGE_SIZE, filteredMaterials.length)} / ${filteredMaterials.length} ta ko'rsatilmoqda`}
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

        {/* Panel 3: Staff Rating */}
        {activePanel === 'ratings' && (
          <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-6">
              <h3 className="font-semibold text-base text-gov-text text-left">
                {lang === 'ru' ? 'Рейтинг и показатели сотрудников отделения' : 'Bo\'lim xodimlari reytingi va ko\'rsatkichlari'}
              </h3>
              <ExportButton
                lang={lang}
                onClick={() => exportToExcel(
                  lang === 'ru' ? 'reyting_sotrudnikov' : 'xodimlar_reytingi',
                  [lang === 'ru' ? 'Следователь' : 'Tergovchi', 'Likes', 'Dislikes', lang === 'ru' ? 'Всего дел' : 'Jami ishlar', lang === 'ru' ? 'В производстве' : 'Ijroda', lang === 'ru' ? 'Индекс %' : 'Indeks %'],
                  officers.filter(o => o.role === 'investigator').map(o => {
                    const cases = materials.filter(m => m.officer === o.id);
                    return [
                      lang === 'ru' ? o.name_ru : o.name_uz,
                      o.likes, o.dislikes, cases.length,
                      cases.filter(m => m.status !== 'закрыт_в_срок').length,
                      o.index,
                    ];
                  })
                )}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">{lang === 'ru' ? 'Следователь' : 'Tergovchi'}</th>
                    <th className="px-4 py-3">Likes</th>
                    <th className="px-4 py-3">Dislikes</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Всего дел' : 'Jami ishlar'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'В производстве' : 'Ijroda'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Индекс удовлетворенности' : 'Mamnunlik indeksi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Отзывы' : 'Fikrlar'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-xs">
                  {officers.filter(o => o.role === 'investigator').map(o => {
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
                        <td className="px-4 py-3">
                          <button onClick={() => openOfficerRatings(o)} className="font-bold text-gov-success hover:underline">{o.likes}</button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openOfficerRatings(o)} className="font-bold text-gov-danger hover:underline">{o.dislikes}</button>
                        </td>
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
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openOfficerRatings(o)}
                            className="p-1.5 bg-gov-border/20 border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors inline-flex"
                            title={lang === 'ru' ? 'Показать отзывы' : 'Fikrlarni ko\'rsatish'}
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
        )}

        {/* Panel 4: Approvals */}
        {activePanel === 'approvals' && (
          <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6 ">
            <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
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

        {/* Panel 5: Users (create/manage staff accounts) */}
        {activePanel === 'users' && (
          <div className="space-y-6">
            <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6  text-left">
              <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6">
                {lang === 'ru' ? 'Создать нового пользователя' : 'Yangi foydalanuvchi yaratish'}
              </h3>

              {createError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-gov-danger text-xs rounded font-medium">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-gov-success text-xs rounded font-medium">
                  {createSuccess}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'Логин' : 'Login'}
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="ivanov"
                    className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'Роль' : 'Rol'}
                  </label>
                  <Select
                    value={newUser.role}
                    onChange={val => setNewUser({ ...newUser, role: val })}
                    className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light"
                    options={[
                      { value: 'investigator', label: ROLE_LABELS.investigator[lang] },
                      { value: 'registrator', label: ROLE_LABELS.registrator[lang] },
                      { value: 'chief', label: ROLE_LABELS.chief[lang] },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'ФИО (рус)' : 'F.I.Sh. (rus)'}
                  </label>
                  <input
                    type="text"
                    value={newUser.name_ru}
                    onChange={e => setNewUser({ ...newUser, name_ru: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                    className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'ФИО (узб)' : 'F.I.Sh. (o\'zb)'}
                  </label>
                  <input
                    type="text"
                    value={newUser.name_uz}
                    onChange={e => setNewUser({ ...newUser, name_uz: e.target.value })}
                    placeholder="Ivanov Ivan Ivanovich"
                    className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'Звание (необязательно)' : 'Unvon (ixtiyoriy)'}
                  </label>
                  <input
                    type="text"
                    value={newUser.rank_ru}
                    onChange={e => setNewUser({ ...newUser, rank_ru: e.target.value, rank_uz: e.target.value })}
                    placeholder={lang === 'ru' ? 'Капитан' : 'Kapitan'}
                    className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'Пароль' : 'Parol'}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewUserPassword ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="password123"
                      className="w-full text-xs p-2 pr-8 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword(s => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gov-muted hover:text-gov-text transition-colors"
                      tabIndex={-1}
                    >
                      {showNewUserPassword ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gov-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
                  >
                    {lang === 'ru' ? 'Создать пользователя' : 'Foydalanuvchi yaratish'}
                  </button>
                  <p className="mt-2 text-[10px] text-gov-muted">
                    {lang === 'ru'
                      ? 'Пароль обязателен, минимум 6 символов'
                      : 'Parol majburiy, kamida 6 ta belgi'}
                  </p>
                </div>
              </form>
            </div>

            <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6  text-left">
              <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6">
                {lang === 'ru' ? 'Существующие пользователи' : 'Mavjud foydalanuvchilar'}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gov-border text-left">
                  <thead>
                    <tr className="bg-gov-border/20 text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                      <th className="px-4 py-3">{lang === 'ru' ? 'Логин' : 'Login'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'ФИО' : 'F.I.Sh.'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Роль' : 'Rol'}</th>
                      <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Действие' : 'Amal'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gov-border text-xs">
                    {officers.map(o => {
                      const login = o.id.startsWith('off_') ? o.id.slice(4) : o.id;
                      return (
                        <tr key={o.id} className="hover:bg-gov-light/30">
                          <td className="px-4 py-3 font-mono font-semibold text-gov-primary">{login}</td>
                          <td className="px-4 py-3 text-gov-text">{lang === 'ru' ? o.name_ru : o.name_uz}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 border border-gov-border rounded-full text-[10px] font-semibold bg-gov-light">
                              {ROLE_LABELS[o.role] ? ROLE_LABELS[o.role][lang] : o.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteUser(o.id)}
                              className="px-2 py-1 bg-rose-50 border border-rose-100 text-gov-danger rounded hover:bg-rose-100 transition-colors text-[10px] font-bold"
                            >
                              {lang === 'ru' ? 'Удалить' : 'O\'chirish'}
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
        )}

        {/* Panel 6: Chat */}
        {activePanel === 'chat' && (
          <ChatPanel lang={lang} user={user} />
        )}

        {activePanel === 'sms' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatCard icon={<SendIcon />} tone="cyan" value={smsTemplates.length} label={lang === 'ru' ? 'Всего текстов' : 'Jami matnlar'} />
              <StatCard icon={<ClockIcon />} tone="pink" value={smsTemplates.filter(t => t.status === 'на_модерации').length} label={lang === 'ru' ? 'На модерации' : 'Moderatsiyada'} />
              <StatCard icon={<ClockIcon />} tone="warning" value={smsTemplates.filter(t => t.status === 'в_процессе').length} label={lang === 'ru' ? 'В процессе' : 'Jarayonda'} />
              <StatCard icon={<ApprovalIcon />} tone="success" value={smsTemplates.filter(t => t.status === 'одобрено').length} label={lang === 'ru' ? 'Одобрено' : 'Tasdiqlangan'} />
              <StatCard icon={<CloseIcon />} tone="danger" value={smsTemplates.filter(t => t.status === 'отказан').length} label={lang === 'ru' ? 'Отказано' : 'Rad etilgan'} />
            </div>

          <div className="bg-gov-surface rounded-2xl shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-6">
              <h3 className="font-semibold text-base text-gov-text">{lang === 'ru' ? 'Тексты SMS-сообщений' : 'SMS xabar matnlari'}</h3>
              <button
                onClick={() => setTemplateModalOpen(true)}
                className="px-3 py-2 bg-gov-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
              >
                + {lang === 'ru' ? 'Добавить текст' : 'Matn qo\'shish'}
              </button>
            </div>

            {smsTemplates.length === 0 ? (
              <div className="text-center py-12 text-gov-muted text-xs font-semibold">
                {lang === 'ru' ? 'Текстов пока нет' : 'Hozircha matnlar yo\'q'}
              </div>
            ) : (
              <div className="space-y-3">
                {smsTemplates.map(t => (
                  <div key={t.template_id} className="border border-gov-border rounded-xl p-4 space-y-2 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {t.trigger_ru && <p className="text-[10px] font-bold text-gov-muted uppercase tracking-wider mb-1">{t.trigger_ru}</p>}
                        <p className="text-xs text-gov-text leading-relaxed whitespace-pre-line">{t.content_ru}</p>
                      </div>
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-semibold leading-none shrink-0 ${getTemplateStatusBadge(t.status)}`}>
                        {getTemplateStatusText(t.status)}
                      </span>
                    </div>

                    {t.status === 'отказан' && t.rejection_reason && (
                      <p className="text-[11px] text-gov-danger bg-rose-50 border border-rose-100 rounded p-2">
                        {lang === 'ru' ? 'Причина отказа' : 'Rad etish sababi'}: {t.rejection_reason}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Select
                        value={t.status}
                        onChange={val => handleTemplateStatusChange(t.template_id, { status: val, ...(val !== 'отказан' ? { rejection_reason: '' } : {}) })}
                        className="text-[11px] p-1.5 border border-gov-border rounded bg-gov-light"
                        options={[
                          { value: 'на_модерации', label: getTemplateStatusText('на_модерации') },
                          { value: 'в_процессе', label: getTemplateStatusText('в_процессе') },
                          { value: 'одобрено', label: getTemplateStatusText('одобрено') },
                          { value: 'отказан', label: getTemplateStatusText('отказан') },
                        ]}
                      />
                      {t.status === 'отказан' && (
                        <input
                          type="text"
                          defaultValue={t.rejection_reason}
                          placeholder={lang === 'ru' ? 'Причина отказа...' : 'Rad etish sababi...'}
                          onBlur={e => handleTemplateStatusChange(t.template_id, { rejection_reason: e.target.value })}
                          className="flex-1 text-[11px] p-1.5 border border-gov-border rounded bg-gov-light"
                        />
                      )}
                      <button
                        onClick={() => handleDeleteTemplate(t.template_id)}
                        className="ml-auto p-1.5 text-gov-muted hover:text-gov-danger hover:bg-rose-50 rounded transition-colors"
                        title={lang === 'ru' ? 'Удалить' : 'O\'chirish'}
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        )}
      </div>

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
              {materialsList.materials.map(m => {
                const off = officers.find(o => o.id === m.officer);
                return (
                  <button
                    key={m.id}
                    onClick={() => { onViewDetails(m.id); setMaterialsList(null); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gov-light transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gov-primary">{m.id}</p>
                      <p className="text-xs text-gov-text truncate">{m.citizen_name}</p>
                      <p className="text-[10px] text-gov-muted truncate">{off ? (lang === 'ru' ? off.name_ru : off.name_uz) : ''}</p>
                    </div>
                    <EyeIcon className="h-4 w-4 text-gov-muted shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {ratingsModal && (
        <Modal onClose={() => setRatingsModal(null)} maxWidth="max-w-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gov-border">
              <h3 className="font-semibold text-base text-gov-text">
                {lang === 'ru' ? ratingsModal.officer.name_ru : ratingsModal.officer.name_uz} — {lang === 'ru' ? 'Отзывы' : 'Fikrlar'} · {ratingsModal.items.length}
              </h3>
              <button onClick={() => setRatingsModal(null)} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors"><CloseIcon className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {ratingsLoading && (
                <p className="text-center py-8 text-gov-muted text-xs font-semibold">{lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}</p>
              )}
              {!ratingsLoading && ratingsModal.items.length === 0 && (
                <p className="text-center py-8 text-gov-muted text-xs font-semibold">
                  {lang === 'ru' ? 'Отзывов пока нет' : 'Hozircha fikrlar yo\'q'}
                </p>
              )}
              {!ratingsLoading && ratingsModal.items.map(r => (
                <div key={r.id} className={`rounded-xl p-3 flex items-start gap-3 ${r.is_like ? 'bg-teal-50/60' : 'bg-rose-50/60'}`}>
                  <div className={`shrink-0 mt-0.5 ${r.is_like ? 'text-gov-success' : 'text-gov-danger'}`}>
                    {r.is_like ? <ThumbUpIcon className="h-4 w-4" /> : <ThumbDownIcon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gov-text">{r.citizen_name}</p>
                    <p className={`text-xs mt-0.5 ${r.is_like ? 'text-gov-success' : 'text-gov-danger'}`}>
                      {lang === 'ru' ? r.reason_ru : r.reason_uz}
                    </p>
                    <p className="text-[10px] text-gov-muted mt-1">{formatDate(r.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {templateModalOpen && (
        <Modal onClose={() => setTemplateModalOpen(false)} maxWidth="max-w-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gov-border">
              <h3 className="font-semibold text-base text-gov-text">{lang === 'ru' ? 'Добавить текст на модерацию' : 'Moderatsiyaga matn qo\'shish'}</h3>
              <button onClick={() => setTemplateModalOpen(false)} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors"><CloseIcon className="h-4 w-4" /></button>
            </div>

            <div className="bg-gov-light/60 border border-gov-border rounded-xl p-3 mb-4 space-y-2 text-[11px] text-gov-muted leading-relaxed max-h-40 overflow-y-auto">
              <p>{lang === 'ru'
                ? 'Вводите текст в точности так, как он будет отправлен получателю — без переменных и масок (их подставит модератор).'
                : 'Matnni aynan qabul qiluvchiga yuboriladigan holatda kiriting — o\'zgaruvchilarsiz (ularni moderator joylashtiradi).'}</p>
              <p className="text-gov-success">✓ {lang === 'ru' ? 'Уважаемый Турсунов Анвар! На вашем счету осталось 32 456.74 сум.' : 'Hurmatli Tursunov Anvar! Hisobingizda 32 456.74 so\'m qoldi.'}</p>
              <p className="text-gov-danger">✗ {lang === 'ru' ? 'Уважаемый #NAME#! На вашем счету осталось #CASH# #CASHNAME#.' : 'Hurmatli #NAME#! Hisobingizda #CASH# #CASHNAME# qoldi.'}</p>
              <p>{lang === 'ru'
                ? 'В текстах с кодами подтверждения обязательно указывайте название ресурса и цель использования кода.'
                : 'Tasdiqlash kodli matnlarda albatta resurs nomi va koddan foydalanish maqsadini ko\'rsating.'}</p>
              <p className="text-gov-success">✓ {lang === 'ru' ? 'Код подтверждения для регистрации на сайте E-Material: 0000' : 'E-Material saytida ro\'yxatdan o\'tish uchun tasdiqlash kodi: 0000'}</p>
              <p>{lang === 'ru' ? 'Модерация занимает от 1 часа до 1 дня (кроме выходных и праздников).' : 'Moderatsiya 1 soatdan 1 kungacha davom etadi (dam olish va bayram kunlaridan tashqari).'}</p>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">{lang === 'ru' ? 'Название / повод' : 'Nomi / sababi'}</label>
                <input
                  type="text"
                  value={newTemplate.trigger_ru}
                  onChange={e => setNewTemplate({ ...newTemplate, trigger_ru: e.target.value })}
                  placeholder={lang === 'ru' ? 'Например: Уведомление об отказе в ВУД' : 'Masalan: JIQni rad etish haqida xabarnoma'}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">{lang === 'ru' ? 'Текст (рус)' : 'Matn (rus)'}</label>
                <textarea
                  required
                  rows={3}
                  value={newTemplate.content_ru}
                  onChange={e => setNewTemplate({ ...newTemplate, content_ru: e.target.value })}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">{lang === 'ru' ? 'Текст (узб)' : 'Matn (o\'zb)'}</label>
                <textarea
                  rows={3}
                  value={newTemplate.content_uz}
                  onChange={e => setNewTemplate({ ...newTemplate, content_uz: e.target.value })}
                  className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTemplateModalOpen(false)} className="px-4 py-2 text-gov-muted hover:text-gov-text text-xs font-semibold rounded transition-colors">
                  {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button type="submit" disabled={savingTemplate} className="px-4 py-2 bg-gov-primary hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50">
                  {savingTemplate ? '...' : (lang === 'ru' ? 'Отправить на модерацию' : 'Moderatsiyaga yuborish')}
                </button>
              </div>
            </form>
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

      {ratingsModalIsLike !== null && (
        <RatingsModal
          lang={lang}
          isLike={ratingsModalIsLike}
          officerIds={investigatorsList.map(o => o.id)}
          officerNames={Object.fromEntries(investigatorsList.map(o => [o.id, lang === 'ru' ? o.name_ru : o.name_uz]))}
          onClose={() => setRatingsModalIsLike(null)}
        />
      )}
    </div>
  );
}

export default ChiefView;
