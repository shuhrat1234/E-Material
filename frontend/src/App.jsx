import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import CitizenView from './components/CitizenView';
import RegistratorView from './components/RegistratorView';
import InvestigatorView from './components/InvestigatorView';
import ChiefView from './components/ChiefView';
import CaseDetailsModal from './components/CaseDetailsModal';
import DeadlineNotifications from './components/DeadlineNotifications';
import ProfileModal from './components/ProfileModal';
import ConfirmHost from './components/ConfirmHost';
import ToastHost from './components/ToastHost';
import { confirm } from './confirmService';
import axios from 'axios';

// API Base URL
export const API_BASE = 'http://localhost:8000/api';

export const TRANSLATIONS = {
  ru: {
    title: "АИС «Е-Материал»",
    subtitle: "Олмазорский РУВД г. Ташкента",
    select_role: "Выберите роль",
    password: "Пароль доступа",
    login_btn: "Войти в систему",
    logout_confirm: "Вы действительно хотите выйти?",
    citizen_tab: "Планшет оценки",
    registrator_tab: "Регистратор",
    investigator_tab: "Следователь: Каримов С.",
    chief_tab: "Начальник отделения: Махмудов Ж.",
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
    subtitle: "Toshkent sh. Olmazor tumani IIO FMB",
    select_role: "Rolni tanlang",
    password: "Kirish paroli",
    login_btn: "Tizimga kirish",
    logout_confirm: "Tizimdan chiqishni xohlaysizmi?",
    citizen_tab: "Baholash plansheti",
    registrator_tab: "Materiallar registratori",
    investigator_tab: "Tergovchi: Karimov S.",
    chief_tab: "Bo'lim boshlig'i: Maxmudov J.",
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
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('em_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }); // { role, name, id, avatar, roleLabel }
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('em_user', JSON.stringify(user));
    else localStorage.removeItem('em_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('em_lang', lang);
  }, [lang]);

  const handleLogin = (selectedUser) => {
    setUser(selectedUser);
    // Log audit login
    axios.post(`${API_BASE}/audit-logs/`, {
      time: new Date().toISOString(),
      user_name: selectedUser.name,
      action_ru: "Авторизация в системе",
      action_uz: "Tizimga kirish muvaffaqiyatli yakunlandi"
    }).catch(err => console.error("Audit log failed", err));
  };

  const handleLogout = async () => {
    const ok = await confirm(TRANSLATIONS[lang].logout_confirm);
    if (ok) {
      axios.post(`${API_BASE}/audit-logs/`, {
        time: new Date().toISOString(),
        user_name: user.name,
        action_ru: "Выход из системы",
        action_uz: "Tizimdan chiqish"
      }).catch(err => console.error("Audit log failed", err));
      setUser(null);
    }
  };

  const renderView = () => {
    if (!user) {
      return <LoginScreen onLogin={handleLogin} lang={lang} setLang={setLang} />;
    }

    switch (user.role) {
      case 'citizen':
        return <CitizenView lang={lang} />;
      case 'registrator':
        return <RegistratorView lang={lang} onViewDetails={setSelectedCaseId} user={user} />;
      case 'investigator':
      case 'inquiry_officer':
        return <InvestigatorView lang={lang} onViewDetails={setSelectedCaseId} user={user} />;
      case 'chief':
        return <ChiefView lang={lang} onViewDetails={setSelectedCaseId} user={user} />;
      default:
        return <div className="p-8 text-center text-red-500">Неизвестная роль</div>;
    }
  };

  const t = TRANSLATIONS[lang];
  const hasSidebar = user && (user.role === 'chief' || user.role === 'investigator');

  return (
    <div className="min-h-screen bg-gov-light flex flex-col">
      {user && (
        <header className={`bg-white text-gov-text px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b border-gov-border shrink-0 ${hasSidebar ? 'md:pl-[17rem]' : ''}`}>
          <div className="flex flex-col items-start">
            <p className="text-sm text-gov-text font-semibold">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* Language Selector */}
            <div className="flex bg-gov-light p-1 rounded-full text-xs font-semibold">
              <button
                onClick={() => setLang('ru')}
                className={`px-3 py-1 rounded-full transition-colors ${lang === 'ru' ? 'bg-white text-gov-primary shadow-sm' : 'text-gov-muted hover:text-gov-text'}`}
              >
                RU
              </button>
              <button
                onClick={() => setLang('uz')}
                className={`px-3 py-1 rounded-full transition-colors ${lang === 'uz' ? 'bg-white text-gov-primary shadow-sm' : 'text-gov-muted hover:text-gov-text'}`}
              >
                UZ
              </button>
            </div>

            {/* Deadline notifications */}
            {(user.role === 'investigator' || user.role === 'chief') && (
              <DeadlineNotifications lang={lang} user={user} onViewDetails={setSelectedCaseId} />
            )}

            {/* User display */}
            <div className="flex items-center gap-3 border-l border-gov-border pl-4">
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2.5 hover:bg-gov-light rounded-lg px-2 py-1.5 -my-1.5 transition-colors"
                title={lang === 'ru' ? 'Мой профиль' : 'Mening profilim'}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gov-border" />
                ) : (
                  <div className="bg-gov-primaryLight text-gov-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {user.photo || user.name[0]}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs font-semibold text-gov-text">{user.name}</p>
                  <p className="text-[10px] text-gov-muted font-medium uppercase tracking-wider">{user.roleLabel}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="ml-1 p-1.5 text-gov-muted hover:text-gov-danger hover:bg-rose-50 rounded-lg transition-all"
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

      <main className={`flex-1 min-w-0 p-6 w-full flex flex-col overflow-x-hidden overflow-y-auto ${!user ? 'items-center justify-center' : ''}`}>
        {renderView()}
      </main>

      {selectedCaseId && (
        <CaseDetailsModal
          caseId={selectedCaseId}
          lang={lang}
          user={user}
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

      <ConfirmHost />
      <ToastHost />
    </div>
  );
}

export default App;
