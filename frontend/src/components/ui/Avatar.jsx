import React from 'react';

function Avatar({ src, initials, size = 'w-10 h-10', textSize = 'text-xs', className = '', initialsClassName = 'bg-gov-primaryLight text-gov-primary' }) {
  if (src) {
    return <img src={src} alt="" className={`${size} rounded-full object-cover shrink-0 ${className}`} />;
  }
  return (
    <div className={`${size} rounded-full flex items-center justify-center font-bold ${textSize} leading-none shrink-0 overflow-hidden ${initialsClassName} ${className}`}>
      <span className="truncate px-0.5">{initials}</span>
    </div>
  );
}

export default Avatar;
