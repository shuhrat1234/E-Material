import React, { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext(null);

const STORAGE_KEY = 'em_settings';
const FONT_SCALES = { sm: '87.5%', md: '100%', lg: '112.5%' };

export const ACCENT_PRESETS = [
  { name: 'blue', hex: '#2563eb' },
  { name: 'teal', hex: '#0d9488' },
  { name: 'purple', hex: '#7c3aed' },
  { name: 'rose', hex: '#e11d48' },
  { name: 'orange', hex: '#ea580c' },
];

const DEFAULT_SETTINGS = { theme: 'light', accent: '#2563eb', fontSize: 'md' };

function hexToTriplet(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function mixHex(baseHex, blendHex, weight) {
  const base = baseHex.replace('#', '');
  const blend = blendHex.replace('#', '');
  const r1 = parseInt(base.substring(0, 2), 16), g1 = parseInt(base.substring(2, 4), 16), b1 = parseInt(base.substring(4, 6), 16);
  const r2 = parseInt(blend.substring(0, 2), 16), g2 = parseInt(blend.substring(2, 4), 16), b2 = parseInt(blend.substring(4, 6), 16);
  const r = Math.round(r1 + (r2 - r1) * weight);
  const g = Math.round(g1 + (g2 - g1) * weight);
  const b = Math.round(b1 + (b2 - b1) * weight);
  return `${r} ${g} ${b}`;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    // ignore corrupt storage
  }
  return { ...DEFAULT_SETTINGS };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const root = document.documentElement;
    root.classList.toggle('dark', isDark);

    root.style.fontSize = FONT_SCALES[settings.fontSize] || FONT_SCALES.md;

    const blendTarget = isDark ? '#0f172a' : '#ffffff';
    root.style.setProperty('--gov-primary', hexToTriplet(settings.accent));
    root.style.setProperty('--gov-primaryLight', mixHex(settings.accent, blendTarget, isDark ? 0.88 : 0.93));
    root.style.setProperty('--gov-primarySoft', mixHex(settings.accent, blendTarget, isDark ? 0.72 : 0.82));
  }, [settings, isDark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }));

  const value = {
    settings,
    isDark,
    setTheme: (theme) => update({ theme }),
    setAccent: (accent) => update({ accent }),
    setFontSize: (fontSize) => update({ fontSize }),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
