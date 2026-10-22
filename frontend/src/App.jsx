import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import MaterialStatusPage from './components/MaterialStatusPage';
import AvatarDemo from './components/AvatarDemo';
import CitizenView from './components/CitizenView';
import AiKioskView from './components/AiKioskView';
import RegistratorView from './components/RegistratorView';
import InvestigatorView from './components/InvestigatorView';
import ChiefView from './components/ChiefView';
import CaseDetailsModal from './components/CaseDetailsModal';
import DeadlineNotifications from './components/DeadlineNotifications';
import DislikeAlertNotifications from './components/DislikeAlertNotifications';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import { GearIcon, MenuIcon, ScaleIcon, AiIcon } from './components/Icons';
import ConfirmHost from './components/ConfirmHost';
import ToastHost from './components/ToastHost';
import Avatar from './components/ui/Avatar';
import { confirm } from './confirmService';
import { DISTRICTS, getActiveDistrictId, getActiveDistrict } from './config/districts';
import axios from 'axios';

// API Base URL.
export const API_BASE = import.meta.env.PROD
  ? `${window.location.protocol}//${window.location.host}/api`
  : `http://${window.location.hostname}:8000/api`;

// Automatically attach active district to all outgoing requests
axios.interceptors.request.use((config) => {
  const activeDept = getActiveDistrictId(window.location.pathname);
  config.headers = config.headers || {};
  if (!config.headers['X-Department']) {
    config.headers['X-Department'] = activeDept;
  }
  return config;
});

export const TRANSLATIONS = {
  ru: {
    title: "АИС «Е-Материал»",
    subtitle: "Подразделение доследственной проверки Следственного отдела при РУВД Олмазорского района",
    select_role: "Выберите роль",
    password: "Пароль доступа",
    login_btn: "Войти в систему",
    logout_confirm: "Вы действительно хотите выйти?",
    citizen_tab: "Планшет оценки",
    registrator_tab: "Регистратор",
    investigator_tab: "Следователь",
    chief_tab: "Начальник отделения",
    status_study: "Изучаемый",
    status_closed: "Закрыт в срок",
    status_approaching: "Срок приближается",
    status_overdue: "Срок нарушен",
    common_back: "Назад",
    common_cancel: "Отмена",
    common_save: "Сохранить",
    common_close: "Закрыть",
    common_send_approval: "Отправить на согласование",
    details_title: "Просмотр материала",
    timeline_tab: "Ход прохождения",
    info_tab: "Общая информация"
  },
  uz: {
    title: "AIS «E-Material»",
    subtitle: "Olmazor tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi",
    select_role: "Rolni tanlang",
    password: "Kirish paroli",
    login_btn: "Tizimga kirish",
    logout_confirm: "Tizimdan chiqishni xohlaysizmi?",
    citizen_tab: "Baholash plansheti",
    registrator_tab: "Materiallar registratori",
    investigator_tab: "Tergovchi",
    chief_tab: "Bo'lim boshlig'i",
    status_study: "O'rganilmoqda",
    status_closed: "Muddatida yopildi",
    status_approaching: "Yaqinlashmoqda",
    status_overdue: "Muddati buzilgan",
    common_back: "Orqaga",
    common_cancel: "Bekor qilish",
    common_save: "Saqlash",
    common_close: "Yopish",
    common_send_approval: "Tasdiqlashga yuborish",
    details_title: "Materialni ko'rish",
    timeline_tab: "O'tish bosqichlari",
    info_tab: "Umumiy ma'lumot"
  }
};

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('em_lang') || 'ru');
  const [route, setRoute] = useState(() => window.location.pathname);

  // Active district configuration
  const districtId = getActiveDistrictId(route);
  const currentDistrict = DISTRICTS[districtId] || DISTRICTS.olmazor;
  const currentSubtitle = lang === 'ru' ? currentDistrict.subtitle_ru : currentDistrict.subtitle_uz;

  // Auto-redirect root URL '/' to '/olmazor'
  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({}, '', '/olmazor');
      setRoute('/olmazor');
    }
  }, []);

  const [user, setUser] = useState(() => {
    try {
      const activeDept = getActiveDistrictId(window.location.pathname);
      const scoped = localStorage.getItem(`em_user_${activeDept}`);
      if (scoped) return JSON.parse(scoped);
      const legacy = localStorage.getItem('em_user');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (!parsed.department || parsed.department === activeDept) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  // Switch active district (preserves subpath if useful, or navigates to root of district)
  const switchDistrict = (targetDeptId) => {
    navigate(`/${targetDeptId}`);
  };

  // Sync user state per district
  useEffect(() => {
    if (user) {
      localStorage.setItem(`em_user_${districtId}`, JSON.stringify(user));
      if (districtId === 'olmazor') localStorage.setItem('em_user', JSON.stringify(user));
    } else {
      localStorage.removeItem(`em_user_${districtId}`);
      if (districtId === 'olmazor') localStorage.removeItem('em_user');
    }
  }, [user, districtId]);

  // When switching between /olmazor and /yashnobod, load that district's active user
  useEffect(() => {
    try {
      const scoped = localStorage.getItem(`em_user_${districtId}`);
      if (scoped) {
        setUser(JSON.parse(scoped));
      } else {
        const legacy = localStorage.getItem('em_user');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (parsed.department === districtId || (!parsed.department && districtId === 'olmazor')) {
            setUser(parsed);
            return;
          }
        }
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [districtId]);

  useEffect(() => {
    localStorage.setItem('em_lang', lang);
  }, [lang]);

  // Public, no-login page for citizens tracking their own case
  if (route.includes('/arizalarim')) {
    const initialMaterialId = new URLSearchParams(window.location.search).get('id') || '';
    return <MaterialStatusPage lang={lang} setLang={setLang} onBack={() => navigate(`/${districtId}`)} initialMaterialId={initialMaterialId} />;
  }

  if (route.includes('/avatar-demo')) {
    return <AvatarDemo lang={lang} onBack={() => navigate(`/${districtId}`)} />;
  }

  const handleLogin = (selectedUser) => {
    setUser(selectedUser);
    axios.post(`${API_BASE}/audit-logs/`, {
      time: new Date().toISOString(),
      user_name: selectedUser.name,
      action_ru: `Авторизация в системе (${currentDistrict.name_ru})`,
      action_uz: `Tizimga kirish (${currentDistrict.name_uz})`
    }).catch(err => console.error("Audit log failed", err));
  };

  const handleLogout = async () => {
    const ok = await confirm(TRANSLATIONS[lang].logout_confirm);
    if (ok) {
      if (user) {
        axios.post(`${API_BASE}/audit-logs/`, {
          time: new Date().toISOString(),
          user_name: user.name,
          action_ru: `Выход из системы (${currentDistrict.name_ru})`,
          action_uz: `Tizimdan chiqish (${currentDistrict.name_uz})`
        }).catch(err => console.error("Audit log failed", err));
      }
      localStorage.removeItem(`em_user_${districtId}`);
      if (districtId === 'olmazor') localStorage.removeItem('em_user');
      setUser(null);
    }
  };

  const renderView = () => {
    if (!user) {
      return (
        <LoginScreen
          onLogin={handleLogin}
          lang={lang}
          setLang={setLang}
          districtId={districtId}
          onSwitchDistrict={switchDistrict}
          onOpenStatusCheck={() => navigate(`/${districtId}/arizalarim`)}
        />
      );
    }

    switch (user.role) {
      case 'citizen':
        return <CitizenView lang={lang} />;
      case 'ai_kiosk':
        return <AiKioskView lang={lang} />;
      case 'registrator':
        return <RegistratorView lang={lang} onViewDetails={setSelectedCaseId} user={user} />;
      case 'investigator':
      case 'inquiry_officer':
        return <InvestigatorView lang={lang} onViewDetails={setSelectedCaseId} user={user} onOpenSettings={() => setShowSettings(true)} sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)} />;
      case 'chief':
        return <ChiefView lang={lang} onViewDetails={setSelectedCaseId} user={user} onOpenSettings={() => setShowSettings(true)} sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)} />;
      default:
        return <div className="p-8 text-center text-red-500">Неизвестная роль</div>;
    }
  };

  const t = TRANSLATIONS[lang];
  const hasSidebar = user && (user.role === 'chief' || user.role === 'investigator');

  const KIOSK_LABELS = {
    citizen: { name: { ru: 'Планшет оценки', uz: 'Baholash plansheti' }, roleLabel: { ru: 'Оценка качества', uz: 'Sifatni baholash' }, Icon: ScaleIcon },
    ai_kiosk: { name: { ru: 'AI-помощник', uz: 'AI-yordamchi' }, roleLabel: { ru: 'Приёмная', uz: 'Qabulxona' }, Icon: AiIcon },
  };
  const kioskInfo = user && KIOSK_LABELS[user.role];
  const displayName = kioskInfo ? kioskInfo.name[lang] : user?.name;
  const displayRoleLabel = kioskInfo ? kioskInfo.roleLabel[lang] : user?.roleLabel;

  return (
    <div className="min-h-screen bg-gov-light flex flex-col">
      {user && (
        <header className={`bg-gov-surface text-gov-text px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 flex flex-col md:flex-row justify-between items-center border-b border-gov-border shrink-0 ${hasSidebar ? 'lg:pl-[17rem]' : ''}`}>
          <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
            {hasSidebar && (
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="lg:hidden p-2 -ml-2 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all shrink-0"
                title={lang === 'ru' ? 'Меню' : 'Menyu'}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            )}
            <img src="/emblem.png" alt="" className="h-8 w-8 sm:h-11 sm:w-11 lg:h-12 lg:w-12 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gov-primaryLight text-gov-primary uppercase tracking-wide border border-gov-primary/20 shrink-0">
                  {currentDistrict.badge}
                </span>
                <p className="text-[9.5px] sm:text-xs lg:text-sm text-gov-navy font-semibold uppercase leading-tight sm:leading-snug line-clamp-none">
                  {currentSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-start gap-1.5 sm:gap-3 lg:gap-4 mt-2.5 md:mt-0 w-full md:w-auto flex-wrap">
            {/* District Switcher */}
            <div className="flex bg-gov-light p-1 rounded-full text-xs font-semibold shrink-0">
              <button
                onClick={() => switchDistrict('olmazor')}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-colors ${districtId === 'olmazor' ? 'bg-gov-surface text-gov-primary shadow-sm font-bold' : 'text-gov-muted hover:text-gov-text'}`}
                title="Olmazor tumani"
              >
                Olmazor
              </button>
              <button
                onClick={() => switchDistrict('yashnobod')}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-colors ${districtId === 'yashnobod' ? 'bg-gov-surface text-gov-primary shadow-sm font-bold' : 'text-gov-muted hover:text-gov-text'}`}
                title="Yashnobod tumani"
              >
                Yashnobod
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex bg-gov-light p-1 rounded-full text-xs font-semibold shrink-0">
              <button
                onClick={() => setLang('ru')}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-colors ${lang === 'ru' ? 'bg-gov-surface text-gov-primary shadow-sm' : 'text-gov-muted hover:text-gov-text'}`}
              >
                RU
              </button>
              <button
                onClick={() => setLang('uz')}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-colors ${lang === 'uz' ? 'bg-gov-surface text-gov-primary shadow-sm' : 'text-gov-muted hover:text-gov-text'}`}
              >
                UZ
              </button>
            </div>

            {/* Deadline notifications */}
            {(user.role === 'investigator' || user.role === 'chief') && (
              <DeadlineNotifications lang={lang} user={user} onViewDetails={setSelectedCaseId} />
            )}

            {/* Instant dislike alerts, pushed over websocket the moment a citizen rates */}
            {user.role === 'chief' && (
              <DislikeAlertNotifications lang={lang} user={user} />
            )}

            {/* Settings */}
            {!hasSidebar && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 sm:p-2 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all shrink-0"
                title={lang === 'ru' ? 'Настройки интерфейса' : 'Interfeys sozlamalari'}
              >
                <GearIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}

            {/* User display */}
            <div className="flex items-center gap-1.5 sm:gap-3 border-l border-gov-border pl-2 sm:pl-4 min-w-0">
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-1.5 sm:gap-2.5 hover:bg-gov-light rounded-lg px-1 sm:px-2 py-1.5 -my-1.5 transition-colors min-w-0"
                title={lang === 'ru' ? 'Мой профиль' : 'Mening profilim'}
              >
                {kioskInfo ? (
                  <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gov-primaryLight text-gov-primary flex items-center justify-center shrink-0 border border-gov-border">
                    <kioskInfo.Icon className="h-4 w-4" />
                  </span>
                ) : (
                  <Avatar src={user.avatar} initials={user.photo || user.name[0]} size="w-8 h-8 sm:w-10 sm:h-10" textSize="text-[10px] sm:text-xs" className="border border-gov-border shrink-0" />
                )}
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold text-gov-text truncate max-w-[7rem] sm:max-w-none">{displayName}</p>
                  <p className="text-[10px] text-gov-muted font-medium uppercase tracking-wider truncate max-w-[7rem] sm:max-w-none">{displayRoleLabel}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gov-muted hover:text-gov-danger hover:bg-rose-50 rounded-lg transition-all shrink-0"
                title="Exit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 min-w-0 p-3 sm:p-6 w-full flex flex-col overflow-x-hidden overflow-y-auto ${!user ? 'items-center justify-center' : ''}`}>
        {renderView()}
      </main>

      {selectedCaseId && (
        <CaseDetailsModal
          caseId={selectedCaseId}
          lang={lang}
          user={user}
          onSelectCase={(newId) => setSelectedCaseId(newId)}
          onClose={() => setSelectedCaseId(null)}
        />
      )}

      {showProfile && user && (
        <ProfileModal
          user={user}
          lang={lang}
          onClose={() => setShowProfile(false)}
          onSaved={(updatedUser) => setUser(updatedUser)}
        />
      )}

      {showSettings && (
        <SettingsModal lang={lang} onClose={() => setShowSettings(false)} />
      )}

      <ConfirmHost />
      <ToastHost />
    </div>
  );
}

export default App;
