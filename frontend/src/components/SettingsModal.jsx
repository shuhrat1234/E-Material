import React from 'react';
import Modal from './Modal';
import { useSettings, ACCENT_PRESETS } from '../settingsContext';
import { CloseIcon, SunIcon, MoonIcon, GearIcon } from './Icons';

function SettingsModal({ lang, onClose }) {
  const { settings, setTheme, setAccent, setFontSize } = useSettings();

  const themeOptions = [
    { key: 'light', label: lang === 'ru' ? 'Светлая' : "Yorug'", icon: <SunIcon className="h-4 w-4" /> },
    { key: 'dark', label: lang === 'ru' ? 'Тёмная' : "Qorong'i", icon: <MoonIcon className="h-4 w-4" /> },
    { key: 'system', label: lang === 'ru' ? 'Системная' : 'Tizim', icon: <GearIcon className="h-4 w-4" /> },
  ];

  const sizeOptions = [
    { key: 'sm', label: lang === 'ru' ? 'Компактный' : 'Ixcham' },
    { key: 'md', label: lang === 'ru' ? 'Обычный' : "Odatiy" },
    { key: 'lg', label: lang === 'ru' ? 'Крупный' : 'Katta' },
  ];

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gov-border shrink-0">
        <h3 className="font-display font-bold text-gov-text">
          {lang === 'ru' ? 'Настройки интерфейса' : 'Interfeys sozlamalari'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-all"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold text-gov-muted uppercase tracking-wider mb-2.5">
            {lang === 'ru' ? 'Тема оформления' : 'Mavzu'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded border text-xs font-semibold transition-all ${
                  settings.theme === opt.key
                    ? 'border-gov-primary bg-gov-primaryLight text-gov-primary'
                    : 'border-gov-border text-gov-muted hover:border-gov-muted/40'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gov-muted uppercase tracking-wider mb-2.5">
            {lang === 'ru' ? 'Акцентный цвет' : 'Aksent rang'}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                onClick={() => setAccent(preset.hex)}
                title={preset.name}
                className={`w-9 h-9 rounded-full transition-transform hover:scale-110 shrink-0 ${
                  settings.accent.toLowerCase() === preset.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-gov-text' : ''
                }`}
                style={{ backgroundColor: preset.hex }}
              />
            ))}
            <label
              className="w-9 h-9 rounded-full border border-dashed border-gov-border flex items-center justify-center cursor-pointer overflow-hidden relative shrink-0 text-gov-muted"
              title={lang === 'ru' ? 'Свой цвет' : "Boshqa rang"}
            >
              <input
                type="color"
                value={settings.accent}
                onChange={(e) => setAccent(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="text-base leading-none">+</span>
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gov-muted uppercase tracking-wider mb-2.5">
            {lang === 'ru' ? 'Размер интерфейса' : "Interfeys o'lchami"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {sizeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFontSize(opt.key)}
                className={`py-3 rounded border text-xs font-semibold transition-all ${
                  settings.fontSize === opt.key
                    ? 'border-gov-primary bg-gov-primaryLight text-gov-primary'
                    : 'border-gov-border text-gov-muted hover:border-gov-muted/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default SettingsModal;
