import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function Select({ value, onChange, options, placeholder, className = '', panelClassName = '', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapperRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target) && !e.target.closest('[data-select-panel]')) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleReflow = () => {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReflow, true);
    window.addEventListener('resize', handleReflow);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReflow, true);
      window.removeEventListener('resize', handleReflow);
    };
  }, []);

  const toggleOpen = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(o => !o);
  };

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className="w-full flex items-center justify-between gap-2 text-left disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${!selected ? 'text-gov-muted' : ''}`}>
          {selected ? selected.label : (placeholder || '')}
        </span>
        <svg className={`w-3.5 h-3.5 shrink-0 text-gov-muted transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && !disabled && rect && createPortal(
        <div
          data-select-panel
          className={`fixed z-[500] max-h-64 overflow-y-auto bg-gov-surface rounded-xl shadow-pop p-1.5 text-left ${panelClassName}`}
          style={{ top: rect.bottom + 6, left: rect.left, minWidth: rect.width, maxWidth: 260 }}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                String(o.value) === String(value) ? 'bg-gov-primaryLight text-gov-primary font-semibold' : 'text-gov-text hover:bg-gov-light'
              }`}
            >
              {o.label}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-gov-muted">—</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default Select;
