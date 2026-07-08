import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';
import { CloseIcon } from './Icons';
import Modal from './Modal';
import Select from './ui/Select';
import { notify } from '../toastService';

function SmsModal({ caseId, lang, user, onClose, onSent }) {
  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [smsText, setSmsText] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [approvedTemplates, setApprovedTemplates] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/templates/`)
      .then(res => setApprovedTemplates(res.data.filter(t => t.status === 'одобрено')))
      .catch(err => console.error('Failed to load SMS templates', err));
  }, []);

  const fetchCaseItem = () => {
    if (!caseId) return;
    axios.get(`${API_BASE}/materials/${caseId}/`)
      .then(res => {
        setCaseItem(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    setSmsText('');
    fetchCaseItem();
  }, [caseId]);

  const handleSendSms = () => {
    if (!smsText.trim()) return;
    setSendingSms(true);
    axios.post(`${API_BASE}/materials/${caseId}/send-sms/`, {
      text: smsText.trim(),
      user_name: user?.name || 'Сотрудник',
    })
      .then(() => {
        setSendingSms(false);
        notify(lang === 'ru' ? 'SMS отправлено!' : 'SMS yuborildi!', 'success');
        fetchCaseItem();
        if (onSent) onSent();
      })
      .catch(err => {
        console.error(err);
        setSendingSms(false);
        notify(lang === 'ru' ? 'Ошибка при отправке SMS' : 'SMS yuborishda xatolik', 'error');
      });
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gov-border">
          <div>
            <h3 className="font-semibold text-base text-gov-text">{lang === 'ru' ? 'SMS-уведомление' : 'SMS-xabarnoma'}</h3>
            {caseItem && (
              <p className="text-xs text-gov-muted mt-0.5">
                <span className="font-semibold text-gov-primary">{caseItem.id}</span> — {caseItem.citizen_name} · {caseItem.citizen_phone}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gov-muted hover:text-gov-text p-1 -m-1 rounded hover:bg-gov-light transition-colors"><CloseIcon className="h-4 w-4" /></button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gov-muted text-xs font-semibold">{lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}</div>
        ) : (
          <div className="space-y-2">
            {caseItem?.citizen_notification_text && (
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-gov-muted uppercase tracking-wider">{lang === 'ru' ? 'Последнее отправленное' : 'Oxirgi yuborilgan'}</p>
                <p className="text-gov-muted text-xs leading-relaxed bg-gov-light/45 p-3 border border-gov-border rounded whitespace-pre-line">
                  {caseItem.citizen_notification_text}
                </p>
              </div>
            )}

            {approvedTemplates.length > 0 && (
              <Select
                value=""
                onChange={val => {
                  const tpl = approvedTemplates.find(t => t.template_id === val);
                  if (tpl) setSmsText(lang === 'ru' ? tpl.content_ru : (tpl.content_uz || tpl.content_ru));
                }}
                className="w-full text-xs p-2 border border-gov-border rounded bg-gov-light"
                options={[
                  { value: '', label: lang === 'ru' ? '-- Вставить одобренный шаблон --' : '-- Tasdiqlangan shablon qo\'yish --' },
                  ...approvedTemplates.map(t => ({ value: t.template_id, label: (t.trigger_ru || t.template_id) })),
                ]}
              />
            )}

            <textarea
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              rows={5}
              placeholder={lang === 'ru' ? 'Введите текст SMS для отправки заявителю...' : 'Murojaatchiga yuboriladigan SMS matnini kiriting...'}
              className="w-full text-xs p-3 border border-gov-border rounded bg-gov-surface focus:outline-none focus:ring-1 focus:ring-gov-blue/50 resize-none"
            />
            <div className="flex justify-end">
              <button
                disabled={sendingSms || !smsText.trim()}
                onClick={handleSendSms}
                className="px-4 py-2 bg-gov-primary hover:bg-blue-700 text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-50"
              >
                {sendingSms ? '...' : (lang === 'ru' ? 'Отправить SMS' : 'SMS yuborish')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SmsModal;
