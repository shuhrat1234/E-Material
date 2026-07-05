import React, { useEffect, useRef } from 'react';

function Modal({ onClose, children, maxWidth = 'max-w-xl', zIndex = 'z-[110]' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 ${zIndex} bg-gov-navy/50 backdrop-blur-sm flex items-center justify-center p-4`}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={`bg-white border border-gov-border rounded-2xl ${maxWidth} w-full shadow-xl text-left flex flex-col max-h-[90vh]`}
        style={{ animation: 'modalIn 0.18s ease-out' }}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
