// Exports tabular data as a CSV file that opens cleanly in Excel (UTF-8 BOM + ; delimiter,
// since Excel's default locale-aware CSV import expects ; for comma-decimal locales like ru/uz).
export function exportToCsv(filename, headers, rows) {
  const escape = (val) => {
    const s = val === null || val === undefined ? '' : String(val);
    if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [
    headers.map(escape).join(';'),
    ...rows.map(row => row.map(escape).join(';')),
  ];

  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
