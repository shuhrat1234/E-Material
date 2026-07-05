import React from 'react';

function SidebarLink({ icon, label, active, onClick, count, countTone = 'primary' }) {
  const countTones = {
    primary: 'bg-gov-primary text-white',
    danger: 'bg-gov-danger text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
        active ? 'bg-blue-50 text-gov-primary' : 'text-gov-muted hover:bg-gov-light hover:text-gov-text'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={active ? 'text-gov-primary' : 'text-gov-muted'}>{icon}</span>
        <span>{label}</span>
      </span>
      {count !== undefined && count !== null && count > 0 && (
        <span className={`min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center shrink-0 ${countTones[countTone] || countTones.primary}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default SidebarLink;
