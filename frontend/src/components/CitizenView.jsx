import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { CheckIcon, ThumbUpIcon, ThumbDownIcon } from './Icons';

function CitizenView({ lang }) {
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = () => {
    setLoading(true);
    axios.get(`${API_BASE}/officers/`)
      .then(res => {
        setOfficers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading officers", err);
        setLoading(false);
      });
  };

  const handleRate = (isLike) => {
    if (!selectedOfficerId) return;
    
    axios.post(`${API_BASE}/officers/${selectedOfficerId}/rate/`, { isLike })
      .then(() => {
        setSuccess(true);
      })
      .catch(err => {
        console.error("Error submitting rating", err);
      });
  };

  const resetView = () => {
    setSelectedOfficerId(null);
    setSuccess(false);
    fetchOfficers();
  };

  if (loading) {
    return <div className="text-center py-12 text-gov-muted text-sm font-medium">Загрузка...</div>;
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl shadow-card p-10 text-center ">
        <div className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gov-success">
          <CheckIcon className="h-8 w-8" />
        </div>
        <h3 className="font-display font-semibold text-lg text-gov-text uppercase tracking-wide">
          {lang === 'ru' ? 'Спасибо! Ваш отзыв принят' : 'Rahmat! Fikr-mulohazangiz qabul qilindi'}
        </h3>
        <p className="text-sm text-gov-muted mt-3 mb-8">
          {lang === 'ru' 
            ? 'Благодаря вашему участию мы улучшаем качество обслуживания граждан.' 
            : 'Sizning fikringiz tufayli biz fuqarolarga xizmat ko\'rsatish sifatini oshiramiz.'}
        </p>
        <button
          onClick={resetView}
          className="px-6 py-2.5 bg-gov-primary text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          {lang === 'ru' ? 'Вернуться к оценке' : 'Baholashga qaytish'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-gov-primary uppercase tracking-wide">
          {lang === 'ru' ? 'Оценка качества обслуживания' : 'Xizmat sifatini baholash'}
        </h2>
        <p className="text-xs text-gov-muted font-medium mt-2">
          {lang === 'ru' 
            ? 'Выберите сотрудника, работу которого вы оцениваете' 
            : 'Ish faoliyatini baholayotgan xodimingizni tanlang'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {officers.filter(off => off.role === 'investigator').map(off => {
          const isSelected = off.id === selectedOfficerId;
          return (
            <div
              key={off.id}
              onClick={() => setSelectedOfficerId(off.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-4 ${
                isSelected 
                  ? 'border-gov-blue bg-gov-light shadow-sm ring-1 ring-gov-blue/20' 
                  : 'border-gov-border bg-white hover:border-gov-muted/40 hover:bg-gov-light/30'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gov-primary text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {off.photo || off.name_ru[0]}
              </div>
              <div className="text-left overflow-hidden">
                <h4 className="font-semibold text-xs text-gov-text truncate">
                  {lang === 'ru' ? off.name_ru : off.name_uz}
                </h4>
                <p className="text-[10px] text-gov-muted mt-0.5 truncate font-medium uppercase tracking-wider">
                  {lang === 'ru' ? off.rank_ru : off.rank_uz}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedOfficerId && (
        <div className="bg-white rounded-2xl shadow-card p-8 transition-all  max-w-2xl mx-auto mt-8">
          <h3 className="text-center font-display font-semibold text-sm text-gov-text uppercase tracking-wider mb-6">
            {lang === 'ru' ? 'Оцените работу сотрудника' : 'Xodim ishini baholang'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleRate(true)}
              className="py-6 px-4 bg-teal-50 border border-teal-100 hover:border-teal-200 rounded-lg flex flex-col items-center gap-2 hover:bg-teal-100/40 transition-all text-gov-success group"
            >
              <ThumbUpIcon className="h-8 w-8 group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-wider">{lang === 'ru' ? 'LIKE' : 'LIKE'}</span>
              <span className="text-[10px] text-gov-muted font-normal text-center">
                {lang === 'ru' ? '(Вежливое, быстрое обслуживание)' : '(Xushmuomala, tezkor xizmat)'}
              </span>
            </button>
            <button
              onClick={() => handleRate(false)}
              className="py-6 px-4 bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-lg flex flex-col items-center gap-2 hover:bg-rose-100/40 transition-all text-gov-danger group"
            >
              <ThumbDownIcon className="h-8 w-8 group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-wider">{lang === 'ru' ? 'DISLIKE' : 'DISLIKE'}</span>
              <span className="text-[10px] text-gov-muted font-normal text-center">
                {lang === 'ru' ? '(Грубое обращение, долгое ожидание)' : '(Qo\'pol muomala, asossiz kutish)'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CitizenView;
