import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChatPanel from './ChatPanel';
import { CATEGORICAL, SEQUENTIAL } from '../chartColors';
import { DashboardIcon, FolderIcon, UsersIcon, ApprovalIcon, KeyIcon, ChatIcon, EyeIcon, ClockIcon, TrendUpIcon, CloseIcon } from './Icons';
import Card, { CardHeader } from './ui/Card';
import StatCard from './ui/StatCard';
import SidebarLink from './ui/SidebarLink';
import FilterPill from './ui/FilterPill';
import HeroChartCard from './ui/HeroChartCard';
import PillBarChart from './ui/PillBarChart';
import Select from './ui/Select';
import { confirm } from '../confirmService';
import { notify } from '../toastService';

function ChiefView({ lang, onViewDetails, user }) {
  const [activePanel, setActivePanel] = useState('dashboard'); // dashboard, materials, ratings, approvals, users
  const [officers, setOfficers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [departments, setDepartments] = useState([]);

  const ROLE_LABELS = {
    registrator: { ru: 'Регистратор', uz: 'Registrator' },
    investigator: { ru: 'Следователь', uz: 'Tergovchi' },
    chief: { ru: 'Начальник', uz: 'Boshliq' }
  };

  const emptyNewUser = { username: '', name_ru: '', name_uz: '', rank_ru: '', rank_uz: '', role: 'investigator', department: '' };
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Filter States
  const [dateRange, setDateRange] = useState('all');
  const [difficulty, setDifficulty] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [sourceFrom, setSourceFrom] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');

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

    axios.get(`${API_BASE}/departments/`)
      .then(res => setDepartments(res.data));
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

    const parts = newUser.name_ru.split(' ').filter(Boolean);
    const photo = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ? parts[0][0] : 'У');

    axios.post(`${API_BASE}/officers/`, {
      id: `off_${username}`,
      name_ru: newUser.name_ru,
      name_uz: newUser.name_uz || newUser.name_ru,
      rank_ru: newUser.rank_ru || '-',
      rank_uz: newUser.rank_uz || '-',
      role: newUser.role,
      department: newUser.department || null,
      photo
    }).then(() => {
      setCreateSuccess(
        lang === 'ru'
          ? `Пользователь "${username}" создан! Пароль: password123`
          : `"${username}" foydalanuvchisi yaratildi! Parol: password123`
      );
      setNewUser(emptyNewUser);
      fetchData();
    }).catch(err => {
      const idErr = err.response?.data?.id?.[0];
      const msg = idErr
        ? (lang === 'ru' ? 'Такой логин уже занят.' : 'Bu login band.')
        : (lang === 'ru' ? 'Ошибка создания пользователя.' : 'Foydalanuvchi yaratishda xatolik.');
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
    if (officerFilter && c.officer !== officerFilter) return false;
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

  const calculateDeadlines = () => {
    const offsets = { today: 0, tomorrow: 0, indinga: 0, days3: 0, days4: 0, days5: 0, sl1: 0, sl2: 0, sl3: 0, sl4: 0, sl5: 0 };
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
      else if (dl === dStr(4)) offsets.days4++;
      else if (dl === dStr(5)) offsets.days5++;
      else if (dl === dStr(6)) offsets.sl1++;
      else if (dl === dStr(7)) offsets.sl2++;
      else if (dl === dStr(8)) offsets.sl3++;
      else if (dl === dStr(9)) offsets.sl4++;
      else if (dl === dStr(10)) offsets.sl5++;
    });
    return offsets;
  };

  const dl = calculateDeadlines();

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
    const counts = { ariza: 0, bildirgi: 0, sud_ajrimi: 0, boshqa: 0 };
    filteredMaterials.forEach(c => {
      const t = c.material_type || 'ariza';
      if (counts[t] !== undefined) counts[t]++;
    });
    const labels = lang === 'ru' ? ['Заявл.', 'Рапорт', 'Суд.', 'Друг.'] : ['Ariza', 'Bildirgi', 'Sud', 'Boshqa'];
    return [counts.ariza, counts.bildirgi, counts.sud_ajrimi, counts.boshqa].map((value, i) => ({ label: labels[i], value }));
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      {/* Sidebar Nav */}
      <nav className="w-full md:w-64 bg-white rounded-2xl shadow-card md:rounded-none md:shadow-none md:border-r md:border-gov-border p-4 shrink-0 text-left md:fixed md:left-0 md:top-0 md:h-screen md:z-40 md:overflow-y-auto md:flex md:flex-col">
        <div className="space-y-1">
          <div className="p-3 border-b border-gov-border mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gov-primary text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
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
            countTone="danger"
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
          />
        </div>

        <div className="md:mt-auto md:pt-6">
          <div className="text-[9px] font-bold text-gov-muted uppercase tracking-widest px-3 py-1.5">{lang === 'ru' ? 'Сводка' : 'Xulosa'}</div>
          <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
            <span>{lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}:</span>
            <span className="font-bold text-gov-danger">{materials.filter(m => m.status === 'срок_нарушен').length}</span>
          </div>
          <div className="px-3 py-2 text-xs flex items-center justify-between text-gov-muted">
            <span>{lang === 'ru' ? 'Истекает сегодня' : 'Bugun tugaydi'}:</span>
            <span className="font-bold text-gov-warning">{dl.today}</span>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className="flex-1 w-full min-w-0 space-y-6 md:ml-64">
        
        {(activePanel === 'dashboard' || activePanel === 'materials') && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-gov-muted text-xs font-semibold pr-1">
              <FolderIcon className="h-3.5 w-3.5" /> {lang === 'ru' ? 'Фильтры:' : 'Filtrlar:'}
            </span>
            <FilterPill
              icon={<ClockIcon className="h-3.5 w-3.5" />}
              value={dateRange}
              defaultValue="all"
              onChange={e => setDateRange(e.target.value)}
              options={[
                { value: 'all', label: lang === 'ru' ? 'Все время' : 'Barcha vaqt' },
                { value: 'today', label: lang === 'ru' ? 'Сегодня' : 'Bugun' },
                { value: 'days3', label: lang === 'ru' ? 'Посл. 3 дня' : 'Oxirgi 3 kun' },
                { value: 'week', label: lang === 'ru' ? 'За неделю' : 'Shu hafta' },
                { value: 'month', label: lang === 'ru' ? 'За месяц' : 'Shu oy' },
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
                { value: 'ariza', label: lang === 'ru' ? 'Заявление' : 'Ariza' },
                { value: 'bildirgi', label: lang === 'ru' ? 'Рапорт' : 'Bildirgi' },
                { value: 'sud_ajrimi', label: lang === 'ru' ? 'Суд. решение' : 'Sud ajrimi' },
                { value: 'boshqa', label: lang === 'ru' ? 'Другое' : 'Boshqa' },
              ]}
            />
            <FilterPill
              value={sourceFrom}
              defaultValue=""
              onChange={e => setSourceFrom(e.target.value)}
              options={[
                { value: '', label: lang === 'ru' ? 'Все источники' : 'Barcha manbalar' },
                { value: 'tashrif', label: lang === 'ru' ? 'Тамбур' : 'Tashrif' },
                { value: 'prakuratura', label: lang === 'ru' ? 'Прокуратура' : 'Prokuratura' },
                { value: 'prezident_aparat', label: lang === 'ru' ? 'Аппарат Президента' : 'Prezident ap.' },
                { value: 'iio', label: 'ИИО' },
                { value: 'portal', label: lang === 'ru' ? 'Портал' : 'Portal' },
              ]}
            />
            {(dateRange !== 'all' || difficulty || materialType || sourceFrom || officerFilter) && (
              <button
                onClick={() => { setDateRange('all'); setDifficulty(''); setMaterialType(''); setSourceFrom(''); setOfficerFilter(''); }}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard icon={<FolderIcon />} tone="primary" value={total} label={lang === 'ru' ? 'Всего материалов' : 'Jami materiallar'} trend={trendTotal} />
              <StatCard icon={<TrendUpIcon />} tone="primary" value={newCount} label={lang === 'ru' ? 'Новые' : 'Yangi'} trend={trendNew} />
              <StatCard icon={<ClockIcon />} tone="warning" value={activeCount} label={lang === 'ru' ? 'В производстве' : 'Ijroda'} trend={trendActive} />
              <StatCard icon={<ApprovalIcon />} tone="success" value={closedCount} label={lang === 'ru' ? 'Исполнено' : 'Bajarildi'} trend={trendClosed} />
              <StatCard icon={<ClockIcon />} tone="danger" value={overdueCount} label={lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'} trend={trendOverdue} className="col-span-2 md:col-span-1" />
            </div>

            {/* Secondary stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<UsersIcon />} tone="neutral" value={officers.filter(o => o.role === 'investigator').length} label={lang === 'ru' ? 'Следователей' : 'Tergovchilar'} />
              <StatCard icon={<FolderIcon />} tone="neutral" value={departments.length} label={lang === 'ru' ? 'Подразделений' : 'Bo\'limlar'} />
              <StatCard icon={<ApprovalIcon />} tone="primary" value={approvalRequests.length} label={lang === 'ru' ? 'На согласовании' : 'Tasdiqlashda'} />
              <StatCard icon={<TrendUpIcon />} tone="neutral" value={`${total > 0 ? Math.round((closedCount / total) * 100) : 0}%`} label={lang === 'ru' ? 'Доля исполненных' : 'Bajarilganlar ulushi'} />
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
                    { icon: <FolderIcon className="h-3.5 w-3.5" />, value: departments.length, label: lang === 'ru' ? 'Подразделений' : 'Bo\'limlar', color: CATEGORICAL[1] },
                    { icon: <ApprovalIcon className="h-3.5 w-3.5" />, value: approvalRequests.length, label: lang === 'ru' ? 'На согласовании' : 'Tasdiqlashda', color: CATEGORICAL[2] },
                  ]}
                />
              </div>
              <div className="w-full lg:w-[30%] shrink-0">
                <PillBarChart title={lang === 'ru' ? 'Типы материалов' : 'Material turlari'} data={getTypesBarData()} />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-card p-5">
                <h5 className="font-semibold text-sm text-gov-text mb-4 text-left">{lang === 'ru' ? 'Рейтинг следователей, %' : 'Tergovchilar reytingi, %'}</h5>
                <div className="h-64">
                  <Bar data={getOfficersRatingData()} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-5">
                <h5 className="font-semibold text-sm text-gov-text mb-4 text-left">{lang === 'ru' ? 'Распределение по сложности' : 'Murakkablik bo\'yicha taqsimot'}</h5>
                <div className="h-64 flex justify-center">
                  <Doughnut data={getDifficultyData()} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            {/* Table 1: overall status counters */}
            <div className="bg-white rounded-2xl shadow-card p-5 text-left">
              <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                <DashboardIcon /> {lang === 'ru' ? 'Статус материалов' : 'Materiallar holati'}
              </h4>
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-3 py-2">{lang === 'ru' ? 'ВСЕГО' : 'JAMI'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'В РАБОТЕ' : 'IJRODA'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'ИСПОЛНЕНО' : 'BAJARILDI'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'ПРОСРОЧЕНО' : 'MUDDATI O\'TGAN'}</th>
                    <th className="px-3 py-2">{lang === 'ru' ? 'СР. ИНДЕКС %' : 'O\'RT. INDEKS %'}</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="hover:bg-gov-light/30">
                    <td className="px-3 py-3 font-bold text-gov-text text-sm">{total}</td>
                    <td className="px-3 py-3 font-semibold text-gov-text text-sm">{activeCount}</td>
                    <td className="px-3 py-3 font-semibold text-gov-success text-sm">{closedCount}</td>
                    <td className="px-3 py-3">
                      <span className={overdueCount > 0 ? 'font-bold text-gov-danger bg-rose-50 px-2 py-0.5 rounded text-sm' : 'text-gov-muted text-sm'}>{overdueCount}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded bg-gov-blue/10 text-gov-blue font-bold text-sm">{avgIndex}%</span>
                    </td>
                  </tr>
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
            <div className="bg-white rounded-2xl shadow-card p-5 text-left">
              <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                <ClockIcon /> {lang === 'ru' ? 'Сроки по дням' : 'Kunlar bo\'yicha muddatlar'}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gov-border text-left">
                  <thead>
                    <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
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
                  <tbody className="text-xs">
                    <tr className="hover:bg-gov-light/30">
                      <td className="px-3 py-3"><span className="font-bold text-gov-danger bg-rose-50 px-2 py-0.5 rounded">{dl.today}</span></td>
                      <td className="px-3 py-3"><span className="font-bold text-gov-warning bg-amber-50 px-2 py-0.5 rounded">{dl.tomorrow}</span></td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.indinga}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.days3}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.days4}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.days5}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.sl1}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.sl2}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.sl3}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.sl4}</td>
                      <td className="px-3 py-3 font-semibold text-gov-text">{dl.sl5}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department-wide rating stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard icon={<ApprovalIcon />} tone="success" value={totalLikes} label={lang === 'ru' ? 'Положительных отзывов' : 'Ijobiy baholar'} />
              <StatCard icon={<ClockIcon />} tone="danger" value={totalDislikes} label={lang === 'ru' ? 'Отрицательных отзывов' : 'Salbiy baholar'} />
              <StatCard icon={<TrendUpIcon />} tone="neutral" value={newCount} label={lang === 'ru' ? 'Новых за 3 дня' : 'So\'nggi 3 kunda yangi'} />
            </div>

            {/* Approvals queue */}
            <Card>
              <CardHeader icon={<ApprovalIcon />} title={lang === 'ru' ? 'Очередь согласования решений' : 'Qarorlarni tasdiqlash navbati'} />
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex justify-between items-center text-gov-danger">
                  <span>{lang === 'ru' ? 'Ожидают решения' : 'Qaror kutilmoqda'}</span>
                  <strong className="text-sm font-bold">{approvalRequests.length}</strong>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-gov-warning">
                  <span>{lang === 'ru' ? 'Продление сроков' : 'Muddat uzaytirish'}</span>
                  <strong className="text-sm font-bold">0</strong>
                </div>
              </div>
            </Card>

            {/* Per-investigator stats table */}
            <div className="bg-white rounded-2xl shadow-card p-5 text-left">
              <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                <UsersIcon /> {lang === 'ru' ? 'Показатели следователей' : 'Tergovchilar ko\'rsatkichlari'}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gov-border text-left">
                  <thead>
                    <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
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
                      return (
                        <tr key={o.id} className="hover:bg-gov-light/30">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gov-text">{lang === 'ru' ? o.name_ru : o.name_uz}</p>
                            <p className="text-[10px] text-gov-muted mt-0.5 uppercase font-medium">{lang === 'ru' ? o.rank_ru : o.rank_uz}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-gov-text">{cases.length}</td>
                          <td className="px-4 py-3 text-gov-text">{active}</td>
                          <td className="px-4 py-3 text-gov-success">{closed}</td>
                          <td className="px-4 py-3">
                            {overdue > 0 ? <span className="font-bold text-gov-danger bg-rose-50 px-2 py-0.5 rounded">{overdue}</span> : <span className="text-gov-muted">0</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gov-blue">{newOnes}</td>
                          <td className="px-4 py-3">
                            {dueToday > 0 ? <span className="font-bold text-gov-warning bg-amber-50 px-2 py-0.5 rounded">{dueToday}</span> : <span className="text-gov-muted">0</span>}
                          </td>
                          <td className="px-4 py-3 text-gov-text">{simple}</td>
                          <td className="px-4 py-3 text-gov-text">{medium}</td>
                          <td className="px-4 py-3 text-gov-text">{hard}</td>
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
              <div className="bg-white rounded-2xl shadow-card p-5 text-left">
                <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                  <FolderIcon /> {lang === 'ru' ? 'По типу материала' : 'Material turi bo\'yicha'}
                </h4>
                <table className="min-w-full divide-y divide-gov-border text-left text-xs">
                  <tbody className="divide-y divide-gov-border">
                    {[
                      { key: 'ariza', ru: 'Заявление', uz: 'Ariza' },
                      { key: 'bildirgi', ru: 'Рапорт', uz: 'Bildirgi' },
                      { key: 'sud_ajrimi', ru: 'Суд. решение', uz: 'Sud qarori' },
                      { key: 'boshqa', ru: 'Другое', uz: 'Boshqa' }
                    ].map(t => (
                      <tr key={t.key} className="hover:bg-gov-light/30">
                        <td className="px-4 py-2.5 text-gov-text">{lang === 'ru' ? t.ru : t.uz}</td>
                        <td className="px-4 py-2.5 font-bold text-gov-text text-right">{filteredMaterials.filter(m => (m.material_type || 'ariza') === t.key).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-5 text-left">
                <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                  <TrendUpIcon /> {lang === 'ru' ? 'По источнику поступления' : 'Kelib tushish manbasi bo\'yicha'}
                </h4>
                <table className="min-w-full divide-y divide-gov-border text-left text-xs">
                  <tbody className="divide-y divide-gov-border">
                    {[
                      { key: 'tashrif', ru: 'Тамбур', uz: 'Tashrif' },
                      { key: 'prakuratura', ru: 'Прокуратура', uz: 'Prokuratura' },
                      { key: 'prezident_aparat', ru: 'Аппарат Президента', uz: 'Prezident ap.' },
                      { key: 'iio', ru: 'Другой ИИО', uz: 'Boshqa IIO' },
                      { key: 'portal', ru: 'Портал', uz: 'Portal' }
                    ].map(s => (
                      <tr key={s.key} className="hover:bg-gov-light/30">
                        <td className="px-4 py-2.5 text-gov-text">{lang === 'ru' ? s.ru : s.uz}</td>
                        <td className="px-4 py-2.5 font-bold text-gov-text text-right">{filteredMaterials.filter(m => (m.source_from || 'tashrif') === s.key).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department breakdown table */}
            <div className="bg-white rounded-2xl shadow-card p-5 text-left">
              <h4 className="font-semibold text-sm text-gov-text mb-4 flex items-center gap-2">
                <FolderIcon /> {lang === 'ru' ? 'Материалы по подразделениям' : 'Bo\'limlar bo\'yicha materiallar'}
              </h4>
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-2">{lang === 'ru' ? 'Подразделение' : 'Bo\'lim'}</th>
                    <th className="px-4 py-2">{lang === 'ru' ? 'Всего' : 'Jami'}</th>
                    <th className="px-4 py-2">{lang === 'ru' ? 'В работе' : 'Ijroda'}</th>
                    <th className="px-4 py-2">{lang === 'ru' ? 'Исполнено' : 'Bajarildi'}</th>
                    <th className="px-4 py-2">{lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gov-border">
                  {departments.map(d => {
                    const deptMaterials = filteredMaterials.filter(m => m.department === d.id);
                    return (
                      <tr key={d.id} className="hover:bg-gov-light/30">
                        <td className="px-4 py-3 font-semibold text-gov-text">{lang === 'ru' ? d.name_ru : d.name_uz}</td>
                        <td className="px-4 py-3 font-bold text-gov-text">{deptMaterials.length}</td>
                        <td className="px-4 py-3 text-gov-text">{deptMaterials.filter(m => m.status !== 'закрыт_в_срок').length}</td>
                        <td className="px-4 py-3 text-gov-success">{deptMaterials.filter(m => m.status === 'закрыт_в_срок').length}</td>
                        <td className="px-4 py-3">
                          {(() => {
                            const c = deptMaterials.filter(m => m.status === 'срок_нарушен').length;
                            return c > 0 ? <span className="font-bold text-gov-danger bg-rose-50 px-2 py-0.5 rounded">{c}</span> : <span className="text-gov-muted">0</span>;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel 2: All Materials with Reassignments */}
        {activePanel === 'materials' && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              {lang === 'ru' ? 'Мониторинг всех материалов доследственной проверки' : 'Barcha tekshiruv materiallari monitoringi'}
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Исполнитель / Переназначить' : 'Ijrochi / Qayta biriktirish'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Заявитель' : 'Murojaatchi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Содержание' : 'Mazmuni'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Срок' : 'Muddat'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
                    <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Просмотр' : 'Ko\'rish'}</th>
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
                            <Select
                              value=""
                              onChange={(val) => handleReassign(c.id, val)}
                              className="text-[10px] p-1 border border-gov-border rounded-lg bg-gov-light w-32"
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
                            className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold leading-none w-auto ${getStatusBadge(c.status)}`}
                            options={[
                              { value: 'изучаемый', label: lang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda' },
                              { value: 'срок_приближается', label: lang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda' },
                              { value: 'срок_нарушен', label: lang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan' },
                              { value: 'закрыт_в_срок', label: lang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi' },
                            ]}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onViewDetails(c.id)}
                            className="p-1.5 bg-gov-light border border-gov-border text-gov-text rounded hover:bg-gov-border/30 transition-colors inline-flex"
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

        {/* Panel 3: Staff Rating */}
        {activePanel === 'ratings' && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6 text-left">
              {lang === 'ru' ? 'Рейтинг и показатели сотрудников отделения' : 'Bo\'lim xodimlari reytingi va ko\'rsatkichlari'}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gov-border text-left">
                <thead>
                  <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                    <th className="px-4 py-3">{lang === 'ru' ? 'Следователь' : 'Tergovchi'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Подразделение' : 'Bo\'lim'}</th>
                    <th className="px-4 py-3">Likes</th>
                    <th className="px-4 py-3">Dislikes</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Всего дел' : 'Jami ishlar'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'В производстве' : 'Ijroda'}</th>
                    <th className="px-4 py-3">{lang === 'ru' ? 'Индекс удовлетворенности' : 'Mamnunlik indeksi'}</th>
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
                        <td className="px-4 py-3 text-gov-muted uppercase tracking-wider font-bold text-[10px]">
                          {(() => {
                            const dept = departments.find(d => d.id === o.department);
                            return dept ? (lang === 'ru' ? dept.name_ru : dept.name_uz) : '—';
                          })()}
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
          <div className="bg-white rounded-2xl shadow-card p-6 ">
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
                          <span className="text-xs font-bold text-gov-primary">{req.case}</span>
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

        {/* Panel 5: Users (create/manage staff accounts) */}
        {activePanel === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card p-6  text-left">
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
                    className="w-full text-xs p-2 border border-gov-border rounded-xl bg-gov-light"
                    options={[
                      { value: 'investigator', label: ROLE_LABELS.investigator[lang] },
                      { value: 'registrator', label: ROLE_LABELS.registrator[lang] },
                      { value: 'chief', label: ROLE_LABELS.chief[lang] },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                    {lang === 'ru' ? 'Отдел' : 'Bo\'lim'}
                  </label>
                  <Select
                    value={newUser.department}
                    onChange={val => setNewUser({ ...newUser, department: val })}
                    className="w-full text-xs p-2 border border-gov-border rounded-xl bg-gov-light"
                    options={[
                      { value: '', label: lang === 'ru' ? '-- Без отдела --' : '-- Bo\'limsiz --' },
                      ...departments.map(d => ({ value: d.id, label: lang === 'ru' ? d.name_ru : d.name_uz })),
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
                    {lang === 'ru' ? 'Звание' : 'Unvon'}
                  </label>
                  <input
                    type="text"
                    value={newUser.rank_ru}
                    onChange={e => setNewUser({ ...newUser, rank_ru: e.target.value, rank_uz: e.target.value })}
                    placeholder={lang === 'ru' ? 'Капитан' : 'Kapitan'}
                    className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-blue/50"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gov-primary text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    {lang === 'ru' ? 'Создать пользователя' : 'Foydalanuvchi yaratish'}
                  </button>
                  <p className="mt-2 text-[10px] text-gov-muted">
                    {lang === 'ru'
                      ? 'Пароль по умолчанию для новых пользователей: password123'
                      : 'Yangi foydalanuvchilar uchun standart parol: password123'}
                  </p>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6  text-left">
              <h3 className="font-semibold text-base text-gov-text border-b border-gov-border pb-3 mb-6">
                {lang === 'ru' ? 'Существующие пользователи' : 'Mavjud foydalanuvchilar'}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gov-border text-left">
                  <thead>
                    <tr className="bg-gov-light text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                      <th className="px-4 py-3">{lang === 'ru' ? 'Логин' : 'Login'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'ФИО' : 'F.I.Sh.'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Роль' : 'Rol'}</th>
                      <th className="px-4 py-3">{lang === 'ru' ? 'Отдел' : 'Bo\'lim'}</th>
                      <th className="px-4 py-3 text-center">{lang === 'ru' ? 'Действие' : 'Amal'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gov-border text-xs">
                    {officers.map(o => {
                      const dept = departments.find(d => d.id === o.department);
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
                          <td className="px-4 py-3 text-gov-muted text-[10px] uppercase font-bold tracking-wider">
                            {dept ? (lang === 'ru' ? dept.name_ru : dept.name_uz) : '—'}
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
      </div>
    </div>
  );
}

export default ChiefView;
