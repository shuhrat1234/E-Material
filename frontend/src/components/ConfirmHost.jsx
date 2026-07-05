import React, { useState, useEffect } from 'react';
import { registerConfirmHost } from '../confirmService';
import Modal from './Modal';

function ConfirmHost() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    registerConfirmHost((req) => setRequest(req));
  }, []);

  if (!request) return null;

  const close = (result) => {
    request.resolve(result);
    setRequest(null);
  };

  return (
    <Modal onClose={() => close(false)} maxWidth="max-w-sm" zIndex="z-[200]">
      <div className="p-6 text-left">
        <h3 className="font-semibold text-base text-gov-text mb-2">
          {request.title || (request.danger ? 'Подтвердите действие' : 'Подтверждение')}
        </h3>
        <p className="text-sm text-gov-muted leading-relaxed">{request.message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => close(false)}
            className="px-4 py-2 text-xs font-semibold text-gov-muted hover:bg-gov-light rounded-lg transition-colors"
          >
            {request.cancelLabel || 'Отмена'}
          </button>
          <button
            onClick={() => close(true)}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
              request.danger ? 'bg-gov-danger hover:bg-rose-700' : 'bg-gov-primary hover:bg-blue-700'
            }`}
          >
            {request.confirmLabel || 'OK'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmHost;
