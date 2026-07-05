import React, { useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import Modal from './Modal';
import { CloseIcon } from './Icons';

function ProfileModal({ user, lang, onClose, onSaved }) {
  const [nameRu, setNameRu] = useState(user.name_ru || user.name || '');
  const [nameUz, setNameUz] = useState(user.name_uz || user.name || '');
  const [rankRu, setRankRu] = useState(user.rank_ru || user.roleLabel || '');
  const [rankUz, setRankUz] = useState(user.rank_uz || user.roleLabel || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const initials = user.photo || (nameRu ? nameRu[0] : 'U');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    if (!nameRu.trim()) {
      setError(lang === 'ru' ? 'Укажите ФИО' : 'F.I.Sh. kiriting');
      return;
    }

    const formData = new FormData();
    formData.append('name_ru', nameRu);
    formData.append('name_uz', nameUz || nameRu);
    formData.append('rank_ru', rankRu);
    formData.append('rank_uz', rankUz || rankRu);
    if (avatarFile) formData.append('avatar', avatarFile);

    setSaving(true);
    axios.patch(`${API_BASE}/officers/${user.id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => {
      const o = res.data;
      onSaved({
        ...user,
        name: o.name_ru,
        name_ru: o.name_ru,
        name_uz: o.name_uz,
        rank_ru: o.rank_ru,
        rank_uz: o.rank_uz,
        roleLabel: o.rank_ru,
        avatar: o.avatar || null,
      });
      onClose();
    }).catch(() => {
      setError(lang === 'ru' ? 'Не удалось сохранить профиль' : 'Profilni saqlab bo\'lmadi');
    }).finally(() => setSaving(false));
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-base text-gov-text">{lang === 'ru' ? 'Мой профиль' : 'Mening profilim'}</h3>
          <button onClick={onClose} className="p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-colors">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-16 h-16 rounded-full shrink-0 overflow-hidden bg-gov-primaryLight text-gov-primary flex items-center justify-center font-bold text-xl border border-gov-border group"
              title={lang === 'ru' ? 'Изменить аватар' : 'Avatarni o\'zgartirish'}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : initials}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">
                {lang === 'ru' ? 'Изменить' : 'O\'zgartirish'}
              </span>
            </button>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-semibold text-gov-primary hover:underline"
              >
                {lang === 'ru' ? 'Загрузить фото' : 'Rasm yuklash'}
              </button>
              <p className="text-[11px] text-gov-muted mt-1">{lang === 'ru' ? 'JPG, PNG до 5MB' : 'JPG, PNG 5MB gacha'}</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                {lang === 'ru' ? 'ФИО (рус)' : 'F.I.Sh. (rus)'}
              </label>
              <input
                value={nameRu}
                onChange={e => setNameRu(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-gov-border rounded-lg bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                {lang === 'ru' ? 'ФИО (узб)' : 'F.I.Sh. (o\'zb)'}
              </label>
              <input
                value={nameUz}
                onChange={e => setNameUz(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-gov-border rounded-lg bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                {lang === 'ru' ? 'Должность (рус)' : 'Lavozim (rus)'}
              </label>
              <input
                value={rankRu}
                onChange={e => setRankRu(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-gov-border rounded-lg bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gov-muted mb-1">
                {lang === 'ru' ? 'Должность (узб)' : 'Lavozim (o\'zb)'}
              </label>
              <input
                value={rankUz}
                onChange={e => setRankUz(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-gov-border rounded-lg bg-gov-light focus:outline-none focus:ring-1 focus:ring-gov-primary"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-gov-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gov-muted hover:bg-gov-light rounded-lg transition-colors"
            >
              {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-gov-primary hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? (lang === 'ru' ? 'Сохранение...' : 'Saqlanmoqda...') : (lang === 'ru' ? 'Сохранить' : 'Saqlash')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default ProfileModal;
