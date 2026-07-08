import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { CheckIcon, ThumbUpIcon, ThumbDownIcon } from './Icons';
import Avatar from './ui/Avatar';

const LIKE_REASONS = [
  { value: 'polite', ru: 'Вежливое обращение', uz: 'Xushmuomalalik' },
  { value: 'fast', ru: 'Быстрое обслуживание', uz: 'Tezkor xizmat' },
  { value: 'professional', ru: 'Профессионализм', uz: 'Professionallik' },
  { value: 'clear', ru: 'Понятное объяснение', uz: 'Tushunarli tushuntirish' },
  { value: 'attentive', ru: 'Внимательное отношение', uz: 'Diqqatli munosabat' },
  { value: 'helpful', ru: 'Помог решить вопрос', uz: 'Muammoni hal qilishga yordam berdi' },
  { value: 'ontime', ru: 'Соблюдение сроков', uz: 'Muddatlarga rioya qilish' },
  { value: 'respectful', ru: 'Уважительное отношение', uz: 'Hurmatli munosabat' },
  { value: 'competent', ru: 'Хорошее знание дела', uz: 'Ishni yaxshi bilishi' },
  { value: 'friendly', ru: 'Доброжелательность', uz: 'Xayrixohlik' },
  { value: 'objective', ru: 'Объективное решение', uz: 'Xolisona qaror' },
  { value: 'available', ru: 'Легко было связаться', uz: 'Bog\'lanish oson bo\'ldi' },
  { value: 'followup', ru: 'Держал в курсе дела', uz: 'Jarayondan xabardor qilib turdi' },
  { value: 'clean', ru: 'Чистота и порядок в кабинете', uz: 'Kabinetda tozalik va tartib' },
];

const DISLIKE_REASONS = [
  { value: 'rude', ru: 'Грубое обращение', uz: 'Qo\'pol muomala' },
  { value: 'slow', ru: 'Долгое ожидание', uz: 'Uzoq kutish' },
  { value: 'incompetent', ru: 'Некомпетентность', uz: 'Nokompetentlik' },
  { value: 'unhelpful', ru: 'Вопрос не решен', uz: 'Muammo hal qilinmadi' },
  { value: 'indifferent', ru: 'Равнодушное отношение', uz: 'Beparvo munosabat' },
  { value: 'delayed', ru: 'Нарушение сроков', uz: 'Muddatlarning buzilishi' },
  { value: 'noinfo', ru: 'Отсутствие информации', uz: 'Ma\'lumot yo\'qligi' },
  { value: 'unfair', ru: 'Необъективное решение', uz: 'Noxolis qaror' },
  { value: 'unreachable', ru: 'Невозможно было связаться', uz: 'Bog\'lanib bo\'lmadi' },
  { value: 'redirect', ru: 'Отправляли по кругу', uz: 'Bir joydan ikkinchisiga yuborishdi' },
  { value: 'bribe', ru: 'Требование взятки', uz: 'Pora talab qilish' },
  { value: 'unprofessional', ru: 'Непрофессиональные действия', uz: 'Nokasbiy harakatlar' },
  { value: 'noexplanation', ru: 'Не объяснили причину решения', uz: 'Qaror sababini tushuntirishmadi' },
  { value: 'lostdocs', ru: 'Утеря или порча документов', uz: 'Hujjatlarning yo\'qolishi yoki buzilishi' },
];

function CitizenView({ lang }) {
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null); // null | true | false
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [citizenName, setCitizenName] = useState('');
  const [nameError, setNameError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const isNameValid = citizenName.trim().length >= 3;

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

  const toggleReason = (reason) => {
    setSelectedReasons(prev =>
      prev.some(r => r.value === reason.value)
        ? prev.filter(r => r.value !== reason.value)
        : [...prev, reason]
    );
  };

  const handleSubmitRating = () => {
    if (!selectedOfficerId || selectedRating === null || selectedReasons.length === 0) return;
    if (!isNameValid) {
      setNameError(lang === 'ru' ? 'Укажите Ф.И.О. (минимум 3 символа)' : 'F.I.Sh.ni kiriting (kamida 3 belgi)');
      return;
    }

    axios.post(`${API_BASE}/officers/${selectedOfficerId}/rate/`, {
      isLike: selectedRating,
      reasonRu: selectedReasons.map(r => r.ru).join(', '),
      reasonUz: selectedReasons.map(r => r.uz).join(', '),
      citizenName: citizenName.trim(),
    })
      .then(() => {
        setSuccess(true);
      })
      .catch(err => {
        console.error("Error submitting rating", err);
      });
  };

  const selectOfficer = (id) => {
    setSelectedOfficerId(id);
    setSelectedRating(null);
    setSelectedReasons([]);
  };

  const selectRating = (isLike) => {
    setSelectedRating(isLike);
    setSelectedReasons([]);
  };

  const resetView = () => {
    setSelectedOfficerId(null);
    setSelectedRating(null);
    setSelectedReasons([]);
    setCitizenName('');
    setNameError('');
    setSuccess(false);
    fetchOfficers();
  };

  if (loading) {
    return <div className="text-center py-12 text-gov-muted text-sm font-medium">Загрузка...</div>;
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-gov-surface rounded-2xl shadow-card p-10 text-center ">
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
    <div className="w-full max-w-5xl mx-auto space-y-8 py-6">
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

      <div className="bg-gov-surface rounded-lg shadow-card p-5 max-w-5xl mx-auto">
        <label className="block text-xs font-semibold text-gov-muted uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Ваше Ф.И.О.' : 'F.I.Sh.ingiz'}
        </label>
        <input
          type="text"
          autoFocus
          value={citizenName}
          onChange={(e) => {
            setCitizenName(e.target.value);
            if (nameError) setNameError('');
          }}
          placeholder={lang === 'ru' ? 'Иванов Иван Иванович' : 'Ivanov Ivan Ivanovich'}
          className={`block w-full px-4 py-2.5 rounded-md bg-gov-light text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all ${nameError ? 'ring-2 ring-gov-danger/40' : ''}`}
        />
        {nameError && <p className="text-[11px] text-gov-danger mt-2">{nameError}</p>}
      </div>

      {isNameValid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {officers.filter(off => off.role === 'investigator').map(off => {
            const isSelected = off.id === selectedOfficerId;
            return (
              <div
                key={off.id}
                onClick={() => selectOfficer(off.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-4 ${
                  isSelected
                    ? 'border-gov-blue bg-gov-light shadow-sm ring-1 ring-gov-blue/20'
                    : 'border-gov-border bg-gov-surface hover:border-gov-muted/40 hover:bg-gov-light/30'
                }`}
              >
                <Avatar src={off.avatar} initials={off.photo || off.name_ru[0]} initialsClassName="bg-gov-primary text-white shadow-sm" />
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
      )}

      {selectedOfficerId && (
        <div className="bg-gov-surface rounded-2xl shadow-card p-8 transition-all max-w-2xl mx-auto mt-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h3 className="text-center font-display font-semibold text-sm text-gov-text uppercase tracking-wider">
              {lang === 'ru' ? 'Оцените работу сотрудника' : 'Xodim ishini baholang'}
            </h3>
            {selectedRating !== null && (
              <button
                onClick={() => { setSelectedRating(null); setSelectedReasons([]); }}
                className="text-[10px] font-semibold text-gov-muted hover:text-gov-primary underline uppercase tracking-wider"
              >
                {lang === 'ru' ? 'Изменить' : 'O\'zgartirish'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => selectRating(true)}
              className={`py-6 px-4 bg-teal-50 border rounded-lg flex flex-col items-center gap-2 transition-all text-gov-success group ${
                selectedRating === true
                  ? 'border-gov-success ring-2 ring-gov-success/30'
                  : selectedRating === false
                    ? 'border-teal-100 opacity-40'
                    : 'border-teal-100 hover:border-teal-200 hover:bg-teal-100/40'
              }`}
            >
              <ThumbUpIcon className="h-8 w-8 group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-wider">LIKE</span>
              <span className="text-[10px] text-gov-muted font-normal text-center">
                {lang === 'ru' ? '(Вежливое, быстрое обслуживание)' : '(Xushmuomala, tezkor xizmat)'}
              </span>
            </button>
            <button
              onClick={() => selectRating(false)}
              className={`py-6 px-4 bg-rose-50 border rounded-lg flex flex-col items-center gap-2 transition-all text-gov-danger group ${
                selectedRating === false
                  ? 'border-gov-danger ring-2 ring-gov-danger/30'
                  : selectedRating === true
                    ? 'border-rose-100 opacity-40'
                    : 'border-rose-100 hover:border-rose-200 hover:bg-rose-100/40'
              }`}
            >
              <ThumbDownIcon className="h-8 w-8 group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-wider">DISLIKE</span>
              <span className="text-[10px] text-gov-muted font-normal text-center">
                {lang === 'ru' ? '(Грубое обращение, долгое ожидание)' : '(Qo\'pol muomala, asossiz kutish)'}
              </span>
            </button>
          </div>

          {selectedRating !== null && (
            <div className="mt-6 pt-6 border-t border-gov-border">
              <p className="text-center text-[11px] font-semibold text-gov-muted uppercase tracking-wider mb-1">
                {selectedRating
                  ? (lang === 'ru' ? 'Что вам понравилось?' : 'Sizga nima yoqdi?')
                  : (lang === 'ru' ? 'Что вас не устроило?' : 'Sizni nima qanoatlantirmadi?')}
              </p>
              <p className="text-center text-[10px] text-gov-muted mb-4">
                {lang === 'ru' ? 'Можно выбрать несколько вариантов' : 'Bir nechta variant tanlash mumkin'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(selectedRating ? LIKE_REASONS : DISLIKE_REASONS).map(reason => {
                  const isChecked = selectedReasons.some(r => r.value === reason.value);
                  return (
                    <button
                      key={reason.value}
                      onClick={() => toggleReason(reason)}
                      className={`py-3 px-4 rounded-lg border text-xs font-semibold text-left flex items-center gap-2.5 transition-all ${
                        selectedRating
                          ? (isChecked ? 'border-gov-success bg-teal-100/60 ring-1 ring-gov-success/30' : 'border-teal-100 bg-teal-50/60 hover:border-gov-success hover:bg-teal-100/50')
                          : (isChecked ? 'border-gov-danger bg-rose-100/60 ring-1 ring-gov-danger/30' : 'border-rose-100 bg-rose-50/60 hover:border-gov-danger hover:bg-rose-100/50')
                      } ${selectedRating ? 'text-gov-success' : 'text-gov-danger'}`}
                    >
                      <span className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked
                          ? (selectedRating ? 'bg-gov-success border-gov-success' : 'bg-gov-danger border-gov-danger')
                          : 'border-current bg-gov-surface'
                      }`}>
                        {isChecked && <CheckIcon className="h-3 w-3 text-white" />}
                      </span>
                      {lang === 'ru' ? reason.ru : reason.uz}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmitRating}
                disabled={selectedReasons.length === 0}
                className={`w-full mt-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedReasons.length === 0
                    ? 'bg-gov-light text-gov-muted cursor-not-allowed'
                    : selectedRating
                      ? 'bg-gov-success text-white hover:bg-teal-700'
                      : 'bg-gov-danger text-white hover:bg-rose-700'
                }`}
              >
                {lang === 'ru' ? 'Отправить отзыв' : 'Fikrni yuborish'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CitizenView;
