import * as XLSX from 'xlsx';

// Exports tabular data as a real .xlsx workbook (not CSV) so it opens
// natively in Excel with correct Cyrillic text and no delimiter/locale issues.
export function exportToExcel(filename, headers, rows) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  worksheet['!cols'] = headers.map((header, i) => {
    const values = rows.map(row => String(row[i] ?? ''));
    const longest = Math.max(header.length, ...values.map(v => v.length));
    return { wch: Math.min(Math.max(longest + 2, 10), 50) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
