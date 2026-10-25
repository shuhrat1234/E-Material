import React, { useEffect, useRef, useState, useCallback } from 'react';
import { renderAsync } from 'docx-preview';
import { CloseIcon, DownloadIcon, DocumentIcon } from './Icons';

export default function DocumentPreviewModal({ doc, lang, onClose }) {
  const containerRef = useRef(null);
  const bodyRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scale, setScale] = useState(1);
  const [docDimensions, setDocDimensions] = useState({ width: 816, height: 1100 });

  if (!doc) return null;

  const rawUrl = doc.file_url || '';
  const fileUrl = rawUrl.replace(/^http:\/\//, 'https://');
  const fileName = doc.original_name || 'Hujjat';
  const ext = fileName.split('.').pop().toLowerCase();
  const isDocx = ext === 'docx';
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext);

  // Measure full content bounds including all tables and images to fit completely inside viewport without any clipping
  const measureAndFit = useCallback(() => {
    if (!containerRef.current || !bodyRef.current) return;
    const page = containerRef.current.querySelector('.docx-render, section, .docx') || containerRef.current;
    if (!page) return;

    // Get base width and height
    let maxW = page.offsetWidth || page.scrollWidth || 816;
    let maxH = page.scrollHeight || page.offsetHeight || 1100;

    // Inspect direct children to ensure full content bounds
    if (page.children && page.children.length > 0) {
      Array.from(page.children).forEach(child => {
        const bottom = child.offsetTop + child.offsetHeight + 16;
        if (bottom > maxH) maxH = bottom;
        const right = child.offsetLeft + child.offsetWidth;
        if (right > maxW) maxW = right;
      });
    }

    // Inspect all tables and images to ensure no QR code image or seal is clipped
    const tables = page.querySelectorAll('table');
    tables.forEach(t => {
      const right = t.offsetLeft + t.offsetWidth;
      if (right > maxW) maxW = right;
      const bottom = t.offsetTop + t.offsetHeight + 16;
      if (bottom > maxH) maxH = bottom;
    });

    const imgs = page.querySelectorAll('img');
    imgs.forEach(im => {
      const right = im.offsetLeft + im.offsetWidth;
      if (right > maxW) maxW = right;
      const bottom = im.offsetTop + im.offsetHeight + 16;
      if (bottom > maxH) maxH = bottom;
    });

    if (maxH <= 0 || maxW <= 0) return;

    // Available space inside the modal body with padding
    const availW = Math.max(120, bodyRef.current.clientWidth - 20);
    const availH = Math.max(120, bodyRef.current.clientHeight - 20);

    const s = Math.min(availH / maxH, availW / maxW);
    setDocDimensions({ width: maxW, height: maxH });
    setScale(s);
  }, []);

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
            ignoreHeight: true,
            breakPages: false,
            experimental: true,
            useBase64URL: true,
          });
        })
        .then(() => {
          if (active) {
            setLoading(false);
            // Trigger calculation at several intervals to capture font/image rendering
            setTimeout(measureAndFit, 30);
            setTimeout(measureAndFit, 100);
            setTimeout(measureAndFit, 300);

            if (containerRef.current) {
              const imgs = containerRef.current.querySelectorAll('img');
              imgs.forEach(img => {
                if (!img.complete) {
                  img.onload = measureAndFit;
                }
              });
            }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[96vh] sm:h-[94vh] overflow-hidden border border-gov-border">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-gov-border bg-gov-light/50 shrink-0 gap-2">
          {/* Document Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gov-primaryLight text-gov-primary flex items-center justify-center shrink-0">
              <DocumentIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-gov-navy truncate" title={fileName}>
                {fileName}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gov-muted truncate hidden xs:block">
                {lang === 'ru' ? 'Предварительный просмотр документа' : 'Hujjatni oldindan ko‘rish'}
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={fileUrl}
              download={fileName}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-lg bg-gov-primary text-white text-xs font-semibold hover:bg-gov-primaryDark transition-colors shadow-sm"
              title={lang === 'ru' ? 'Скачать файл' : 'Yuklab olish'}
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Скачать' : 'Yuklab olish'}</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-gov-muted hover:text-gov-text hover:bg-gov-light rounded-lg transition-colors cursor-pointer"
              title={lang === 'ru' ? 'Закрыть' : 'Yopish'}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div
          ref={bodyRef}
          className="flex-1 w-full bg-slate-200/90 flex items-center justify-center p-2 sm:p-4 relative overflow-y-auto overflow-x-hidden"
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
                {lang === 'ru' ? 'Скачать файл' : 'Yuklab olish'}
              </a>
            </div>
          ) : isDocx ? (
            <div
              style={{
                width: `${Math.round(docDimensions.width * scale)}px`,
                height: `${Math.round(docDimensions.height * scale)}px`,
                position: 'relative',
                margin: 'auto',
                transition: 'width 0.15s ease-out, height 0.15s ease-out',
              }}
              className="shadow-2xl rounded-sm bg-white"
            >
              {/* Scaled document viewport */}
              <div
                style={{
                  width: `${docDimensions.width}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  WebkitFontSmoothing: 'antialiased',
                  textRendering: 'optimizeLegibility',
                }}
              >
                <style>{`
                  .docx-preview-container section,
                  .docx-preview-container .docx-render,
                  .docx-preview-container .docx,
                  .docx-preview-container .docx-wrapper {
                    overflow: visible !important;
                    height: auto !important;
                    box-sizing: border-box !important;
                  }
                  .docx-preview-container table {
                    max-width: 100% !important;
                    table-layout: auto !important;
                  }
                  .docx-preview-container td,
                  .docx-preview-container th {
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                  }
                  .docx-preview-container img {
                    max-width: 100% !important;
                    height: auto !important;
                    object-fit: contain !important;
                    display: inline-block !important;
                  }
                `}</style>
                <div
                  ref={containerRef}
                  className="docx-preview-container [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-0 [&_.docx-render]:bg-white [&_.docx]:bg-white [&_.docx-render]:shadow-none [&_.docx]:shadow-none [&_.docx-render]:m-0 [&_.docx]:m-0 [&_.docx-render]:border-0 [&_.docx]:border-0"
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
