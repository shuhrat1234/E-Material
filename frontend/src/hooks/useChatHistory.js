import { useState, useEffect, useCallback } from 'react';

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt/unavailable storage — fall through to default
  }
  return typeof fallback === 'function' ? fallback() : fallback;
}

// Persists a chat message array to localStorage under `key`, reloading
// whenever `key` changes (e.g. switching between officers on a shared
// machine keeps each person's history separate).
export function useChatHistory(key, initial) {
  const [messages, setMessages] = useState(() => loadStored(key, initial));

  useEffect(() => {
    setMessages(loadStored(key, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch {
      // storage full/unavailable — chat still works, just won't persist
    }
  }, [key, messages]);

  const clear = useCallback(() => {
    const fresh = typeof initial === 'function' ? initial() : initial;
    setMessages(fresh);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [messages, setMessages, clear];
}
