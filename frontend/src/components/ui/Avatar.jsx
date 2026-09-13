import React from 'react';

function Avatar({
  src,
  initials,
  size = 'w-14 h-14 sm:w-16 sm:h-16',
  textSize = 'text-sm',
  className = '',
  initialsClassName = 'bg-gov-primaryLight text-gov-primary',
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${size} rounded-full object-cover object-top shrink-0 border-2 border-white shadow-md ring-1 ring-gov-border/60 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold ${textSize} leading-none shrink-0 overflow-hidden ${initialsClassName} border-2 border-white shadow-md ring-1 ring-gov-border/60 ${className}`}
    >
      <span className="truncate px-0.5">{initials}</span>
    </div>
  );
}

export default Avatar;
