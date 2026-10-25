import React, { useEffect, useRef, useState, useCallback } from 'react';
import { renderAsync } from 'docx-preview';
import { CloseIcon, DownloadIcon, DocumentIcon } from './Icons';

export default function DocumentPreviewModal({ doc, lang, onClose }) {
  const containerRef = useRef(null);
  const bodyRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Zoom and fit controls
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' | '100' | 'custom'
  const [docDimensions, setDocDimensions] = useState({ width: 794, height: 1123 });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);

  if (!doc) return null;

  const rawUrl = doc.file_url || '';
  const fileUrl = rawUrl.replace(/^http:\/\//, 'https://');
  const fileName = doc.original_name || 'Hujjat';
  const ext = fileName.split('.').pop().toLowerCase();
  const isDocx = ext === 'docx';
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext);

  // Measure page and calculate exact fit scale to avoid any scrolling
  const measureAndFit = useCallback(() => {
    if (!containerRef.current || !bodyRef.current) return;
    const pages = containerRef.current.querySelectorAll('.docx');
    if (!pages || pages.length === 0) return;

    setTotalPages(pages.length);

    // Multi-page handling: show only current page in fit mode
    if (pages.length > 1) {
      pages.forEach((p, idx) => {
        p.style.display = idx === currentPage ? 'block' : 'none';
        p.style.margin = '0 auto';
      });
    }

    const activePage = pages[Math.min(currentPage, pages.length - 1)];
    if (!activePage) return;

    const pageW = activePage.offsetWidth || 794;
    const pageH = activePage.scrollHeight || activePage.offsetHeight || 1123;
    setDocDimensions({ width: pageW, height: pageH });

    // Deduct padding to guarantee zero scroll
    const availW = Math.max(200, bodyRef.current.clientWidth - 20);
    const availH = Math.max(200, bodyRef.current.clientHeight - 20);

    if (availH > 0 && pageH > 0) {
      const s = Math.min(availH / pageH, availW / pageW);
      setFitScale(s);
      if (zoomMode === 'fit') {
        setScale(s);
      }
    }
  }, [currentPage, zoomMode]);

  useEffect(() => {
    let active = true;

    if (isDocx && containerRef.current && fileUrl) {
      setLoading(true);
      setError(null);
      containerRef.current.innerHTML = '';

      fetch(fileUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          if (!active) return;
          return renderAsync(blob, containerRef.current, null, {
            className: 'docx-render',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            experimental: true,
            useBase64URL: true,
          });
        })
        .then(() => {
          if (active) {
            setLoading(false);
            // Trigger calculation after render completes
            setTimeout(measureAndFit, 60);
          }
        })
        .catch(err => {
          console.error('Failed to preview docx:', err);
          if (active) {
            setError(err.message || 'Hujjatni yuklab bo‘lmadi');
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [fileUrl, isDocx, measureAndFit]);

  // Recalculate fit on container/window resize
  useEffect(() => {
    if (!bodyRef.current) return;
    const ro = new ResizeObserver(() => {
      measureAndFit();
    });
    ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [measureAndFit]);

  const handleSetFit = () => {
    setZoomMode('fit');
    setScale(fitScale);
  };

  const handleSet100 = () => {
    setZoomMode('100');
    setScale(1.0);
  };

  const handleZoomIn = () => {
    setZoomMode('custom');
    setScale(prev => Math.min(2.5, +(prev * 1.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setScale(prev => Math.max(0.3, +(prev * 0.85).toFixed(2)));
  };

  // Only allow scrolling if user zoomed in significantly beyond fit
  const isOverflowAllowed = scale > fitScale * 1.08;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[94vh] overflow-hidden border border-gov-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-gov-border bg-gov-light/50 shrink-0 gap-3">
          {/* Document Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-8 h-8 rounded-lg bg-gov-primaryLight text-gov-primary flex items-center justify-center shrink-0">
              <DocumentIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gov-navy truncate" title={fileName}>
                {fileName}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gov-muted truncate">
                {lang === 'ru' ? 'Предварительный просмотр документа' : 'Hujjatni oldindan ko‘rish'}
              </p>
            </div>
          </div>

          {/* Center: Zoom & Page Controls */}
          {isDocx && !loading && !error && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-white border border-gov-border rounded-xl shadow-2xs">
              {/* Multi-page controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 mr-2 pr-2 border-r border-gov-border text-xs font-semibold text-gov-text">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-1 rounded hover:bg-gov-light disabled:opacity-30 disabled:hover:bg-transparent"
                    title={lang === 'ru' ? 'Предыдущая страница' : 'Oldingi sahifa'}
                  >
                    ◀
                  </button>
                  <span className="text-[11px] px-1 font-mono">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-1 rounded hover:bg-gov-light disabled:opacity-30 disabled:hover:bg-transparent"
                    title={lang === 'ru' ? 'Следующая страница' : 'Keyingi sahifa'}
                  >
                    ▶
                  </button>
                </div>
              )}

              {/* Fit button (No scroll mode) */}
              <button
                type="button"
                onClick={handleSetFit}
                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                  zoomMode === 'fit'
                    ? 'bg-gov-primary text-white shadow-2xs'
                    : 'text-gov-text hover:bg-gov-light'
                }`}
                title={lang === 'ru' ? 'Вписать в экран (без прокрутки)' : 'Ekranga moslash (aylantirishsiz)'}
              >
                {lang === 'ru' ? 'По экрану' : 'Ekranga mos'}
              </button>

              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gov-text hover:bg-gov-light rounded"
                title={lang === 'ru' ? 'Уменьшить' : 'Kichraytirish'}
              >
                −
              </button>

              {/* Percent */}
              <span className="text-[11px] font-mono font-semibold text-gov-muted w-10 text-center">
                {Math.round(scale * 100)}%
              </span>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gov-text hover:bg-gov-light rounded"
                title={lang === 'ru' ? 'Увеличить' : 'Kattalashtirish'}
              >
                +
              </button>

              {/* 100% button */}
              <button
                type="button"
                onClick={handleSet100}
                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                  zoomMode === '100'
                    ? 'bg-gov-primary text-white shadow-2xs'
                    : 'text-gov-text hover:bg-gov-light'
                }`}
                title={lang === 'ru' ? 'Реальный размер 100%' : 'Haqiqiy o‘lcham 100%'}
              >
                100%
              </button>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              download={fileName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gov-primary text-white text-xs font-semibold hover:bg-gov-primaryDark transition-colors shadow-sm"
              title={lang === 'ru' ? 'Скачать файл' : 'Yuklab olish'}
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Скачать' : 'Yuklab olish'}</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-colors"
              title={lang === 'ru' ? 'Закрыть' : 'Yopish'}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div
          ref={bodyRef}
          className={`flex-1 w-full h-full bg-slate-200/90 flex items-center justify-center p-2.5 relative ${
            isOverflowAllowed ? 'overflow-auto' : 'overflow-hidden'
          }`}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
              <div className="w-8 h-8 border-3 border-gov-primary/30 border-t-gov-primary rounded-full animate-spin mb-2" />
              <p className="text-xs font-semibold text-gov-muted">
                {lang === 'ru' ? 'Загрузка и форматирование документа...' : 'Hujjat yuklanmoqda...'}
              </p>
            </div>
          )}

          {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl shadow-xs">
              <DocumentIcon className="h-12 w-12 text-gov-muted mb-3" />
              <p className="text-sm font-bold text-gov-text mb-1">
                {lang === 'ru' ? 'Не удалось отобразить документ' : 'Hujjatni to‘liq ochib bo‘lmadi'}
              </p>
              <p className="text-xs text-gov-muted mb-4 max-w-md">
                {lang === 'ru'
                  ? 'Вы можете скачать файл и открыть его в программе Microsoft Word.'
                  : 'Faylni to‘g‘ridan-to‘g‘ri yuklab olib, Word dasturida ochishingiz mumkin.'}
              </p>
              <a
                href={fileUrl}
                download={fileName}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gov-primary text-white text-xs font-bold hover:bg-gov-primaryDark transition-colors"
              >
                <DownloadIcon className="h-4 w-4" />
                {lang === 'ru' ? 'Скачать файл' : 'Faylni yuklab olish'}
              </a>
            </div>
          ) : isDocx ? (
            /* Outer sizing box prevents any overflow outside the available container */
            <div
              style={{
                width: `${Math.round(docDimensions.width * scale)}px`,
                height: `${Math.round(docDimensions.height * scale)}px`,
                position: 'relative',
                overflow: 'hidden',
                margin: 'auto',
                transition: 'width 0.1s ease-out, height 0.1s ease-out',
              }}
              className="shadow-2xl rounded-sm bg-white"
            >
              {/* Scaled document viewport */}
              <div
                style={{
                  width: `${docDimensions.width}px`,
                  height: `${docDimensions.height}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  WebkitFontSmoothing: 'antialiased',
                  textRendering: 'optimizeLegibility',
                }}
              >
                <div
                  ref={containerRef}
                  className="docx-preview-container [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-0 [&_.docx]:bg-white [&_.docx]:shadow-none [&_.docx]:m-0 [&_.docx]:border-0 [&_.docx]:box-border"
                />
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-full rounded-xl bg-white shadow-xs border border-gov-border"
              title={fileName}
            />
          ) : isImage ? (
            <div className="h-full flex items-center justify-center">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg bg-white"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl shadow-xs">
              <DocumentIcon className="h-12 w-12 text-gov-primary mb-3" />
              <p className="text-sm font-bold text-gov-navy mb-1">{fileName}</p>
              <p className="text-xs text-gov-muted mb-4">
                {lang === 'ru'
                  ? 'Формат файла не поддерживает встроенный просмотр.'
                  : 'Ushbu formatdagi faylni brauzerda to‘g‘ridan-to‘g‘ri ko‘rib bo‘lmaydi.'}
              </p>
              <a
                href={fileUrl}
                download={fileName}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gov-primary text-white text-xs font-bold hover:bg-gov-primaryDark transition-colors"
              >
                <DownloadIcon className="h-4 w-4" />
                {lang === 'ru' ? 'Скачать файл' : 'Yuklab olish'}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
