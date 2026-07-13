import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE, TRANSLATIONS } from '../App';
import { KeyIcon, UsersIcon, EyeIcon, EyeOffIcon } from './Icons';

function LoginScreen({ onLogin, lang, setLang }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg(lang === 'ru' ? 'Введите логин и пароль!' : 'Login va parolni kiriting!');
      return;
    }

    if (username.trim().toLowerCase() === 'planshet' && password === 'planshet') {
      handleCitizenKiosk();
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
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 20%, rgba(37,99,235,0.07), transparent 40%), radial-gradient(circle at 85% 80%, rgba(37,99,235,0.06), transparent 40%)',
      }}
    >
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/emblem.png" alt="" className="h-20 w-20 object-contain mb-3" />
          <p className="text-sm text-gov-text font-extrabold uppercase leading-snug">
            {t.subtitle}
          </p>
        </div>

        <div className="bg-gov-surface rounded-2xl shadow-pop p-8 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-gov-danger text-xs rounded-xl text-left font-medium">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold text-gov-muted mb-1.5">
                {lang === 'ru' ? 'Логин' : 'Login'}
              </label>
              <div className="relative">
                <UsersIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gov-muted" />
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  placeholder="karimov"
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-gov-muted mb-1.5">
                {t.password}
              </label>
              <div className="relative">
                <KeyIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gov-muted" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  placeholder="••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 rounded-xl bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gov-muted hover:text-gov-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl bg-gov-primary text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
            >
              {loading ? (lang === 'ru' ? 'Вход...' : 'Kirilmoqda...') : t.login_btn}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-6">
          <div className="flex bg-gov-surface shadow-card p-1 rounded-full text-xs font-semibold">
            <button
              onClick={() => setLang('ru')}
              className={`px-4 py-1.5 rounded-full transition-colors ${lang === 'ru' ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-muted hover:text-gov-text'}`}
            >
              РУССКИЙ
            </button>
            <button
              onClick={() => setLang('uz')}
              className={`px-4 py-1.5 rounded-full transition-colors ${lang === 'uz' ? 'bg-gov-primaryLight text-gov-primary' : 'text-gov-muted hover:text-gov-text'}`}
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
