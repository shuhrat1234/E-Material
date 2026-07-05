import React, { useState, useRef, useEffect } from 'react';

function FilterPill({ icon, value, onChange, options, defaultValue = '' }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const active = value !== defaultValue;
  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pick = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`relative inline-flex items-center gap-1.5 rounded-full pl-3 pr-7 py-2 text-xs font-semibold transition-colors ${
          active ? 'bg-blue-50 text-gov-primary' : 'bg-gov-light text-gov-text hover:bg-gov-border/50'
        }`}
      >
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span className="max-w-[10rem] truncate">{selected ? selected.label : ''}</span>
        <svg className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 min-w-full w-max max-w-[16rem] max-h-64 overflow-y-auto bg-white rounded-xl shadow-pop p-1.5 text-left">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => pick(o.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                String(o.value) === String(value) ? 'bg-gov-primaryLight text-gov-primary font-semibold' : 'text-gov-text hover:bg-gov-light'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterPill;
