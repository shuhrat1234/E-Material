import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE, TRANSLATIONS } from '../App';

function LoginScreen({ onLogin, lang, setLang }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg(lang === 'ru' ? 'Введите логин и пароль!' : 'Login va parolni kiriting!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    axios.post(`${API_BASE}/auth/login/`, { username, password })
      .then(res => {
        setLoading(false);
        onLogin(res.data);
      })
      .catch(err => {
        setLoading(false);
        if (err.response && err.response.data && err.response.data.error) {
          setErrorMsg(err.response.data.error);
        } else {
          setErrorMsg(lang === 'ru' ? 'Ошибка авторизации. Проверьте данные.' : 'Avtorizatsiya xatosi. Ma\'lumotlarni tekshiring.');
        }
      });
  };

  const handleCitizenKiosk = () => {
    const citizenUser = {
      role: 'citizen',
      name: lang === 'ru' ? 'Планшет оценки' : 'Baholash plansheti',
      id: 'off_citizen',
      roleLabel: lang === 'ru' ? 'Оценка качества' : 'Sifatni baholash',
      photo: 'П'
    };
    onLogin(citizenUser);
  };

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white border border-gov-border p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-display font-black text-2xl text-gov-navy border-b-2 border-emerald-500 pb-0.5">E-MATERIAL</span>
          </div>
          <h2 className="text-center font-display font-semibold text-lg text-gov-text tracking-tight uppercase">
            {t.title}
          </h2>
          <p className="mt-1 text-xs text-gov-muted font-medium">
            {t.subtitle}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-gov-danger text-xs rounded text-left font-medium">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4 text-left">
            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold text-gov-muted uppercase tracking-wider mb-2">
                {lang === 'ru' ? 'Логин' : 'Login'}
              </label>
              <input
                id="username-input"
                type="text"
                value={username}
                placeholder="karimov"
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gov-border rounded bg-gov-light text-sm focus:outline-none focus:ring-1 focus:ring-gov-blue/50 focus:border-gov-blue transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-gov-muted uppercase tracking-wider mb-2">
                {t.password}
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                placeholder="••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gov-border rounded bg-gov-light text-sm focus:outline-none focus:ring-1 focus:ring-gov-blue/50 focus:border-gov-blue transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded text-white bg-gov-navy hover:bg-gov-slate focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-navy transition-all duration-200 tracking-wide uppercase shadow-sm disabled:opacity-50"
            >
              {loading ? (lang === 'ru' ? 'Вход...' : 'Kirilmoqda...') : t.login_btn}
            </button>
          </div>
        </form>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gov-border"></div>
          </div>
          <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-gov-muted tracking-wider">Или</span>
        </div>

        <div>
          <button
            onClick={handleCitizenKiosk}
            className="w-full py-2.5 border border-gov-border text-gov-text hover:bg-gov-light text-xs font-bold uppercase tracking-wider rounded transition-colors"
          >
            {lang === 'ru' ? 'Войти как Гражданин (Планшет)' : 'Fuqaro sifatida kirish (Planshet)'}
          </button>
        </div>

        {/* Credentials hints helper */}
        <div className="bg-gov-light/40 border border-gov-border rounded p-3 text-left">
          <p className="text-[9px] font-bold text-gov-muted uppercase tracking-wider mb-1.5">
            {lang === 'ru' ? 'Тестовые учетные записи (Пароль: password123)' : 'Test akkountlari (Parol: password123)'}
          </p>
          <div className="grid grid-cols-2 gap-y-1 text-[10px] text-gov-text font-medium">
            <div>• <span className="font-semibold text-gov-navy">karimov</span> : Следователь</div>
            <div>• <span className="font-semibold text-gov-navy">registrator</span> : Регистратор</div>
            <div>• <span className="font-semibold text-gov-navy">makhmudov</span> : Начальник</div>
            <div>• <span className="font-semibold text-gov-navy">admin</span> : Django Admin</div>
          </div>
        </div>

        <div className="flex justify-center border-t border-gov-border pt-6">
          <div className="flex bg-gov-light p-0.5 rounded border border-gov-border text-[10px] font-bold">
            <button 
              onClick={() => setLang('ru')} 
              className={`px-3 py-1 rounded transition-colors ${lang === 'ru' ? 'bg-white text-gov-text shadow-sm border border-gov-border/10' : 'text-gray-400 hover:text-gov-text'}`}
            >
              РУССКИЙ
            </button>
            <button 
              onClick={() => setLang('uz')} 
              className={`px-3 py-1 rounded transition-colors ${lang === 'uz' ? 'bg-white text-gov-text shadow-sm border border-gov-border/10' : 'text-gray-400 hover:text-gov-text'}`}
            >
              O'ZBEKCHA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
