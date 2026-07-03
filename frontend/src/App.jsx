import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import CitizenView from './components/CitizenView';
import RegistratorView from './components/RegistratorView';
import InvestigatorView from './components/InvestigatorView';
import ChiefView from './components/ChiefView';
import CaseDetailsModal from './components/CaseDetailsModal';
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
  const [lang, setLang] = useState('ru');
  const [user, setUser] = useState(null); // { role, name, id, avatar, roleLabel }
  const [time, setTime] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // Clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleLogout = () => {
    if (window.confirm(TRANSLATIONS[lang].logout_confirm)) {
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
        return <RegistratorView lang={lang} />;
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

  return (
    <div className="min-h-screen bg-gov-light flex flex-col">
      {user && (
        <header className="bg-gov-navy text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b border-gov-slate/20 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded border border-white/15">
              <span className="font-display font-extrabold text-lg text-emerald-400">E</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight tracking-wide">{t.title}</h1>
              <p className="text-xs text-gov-muted font-medium">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            {/* Language Selector */}
            <div className="flex bg-white/5 p-1 rounded border border-white/10 text-xs font-semibold">
              <button 
                onClick={() => setLang('ru')} 
                className={`px-3 py-1 rounded transition-colors ${lang === 'ru' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                RU
              </button>
              <button 
                onClick={() => setLang('uz')} 
                className={`px-3 py-1 rounded transition-colors ${lang === 'uz' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                UZ
              </button>
            </div>

            {/* Time */}
            <div className="font-mono text-xs text-gray-400 flex items-center gap-1.5">
              <span>{time}</span>
            </div>

            {/* User display */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="bg-white/10 text-emerald-400 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border border-white/5">
                {user.photo || user.name[0]}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-200">{user.name}</p>
                <p className="text-[10px] text-gov-muted font-medium uppercase tracking-wider">{user.roleLabel}</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="ml-3 p-1.5 text-gray-400 hover:text-gov-danger hover:bg-white/5 rounded transition-all"
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

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col overflow-y-auto">
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
    </div>
  );
}

export default App;
