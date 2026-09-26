import * as XLSX from 'xlsx';

/**
 * Format currency in Tanzanian Shillings (TZS) using whole numbers and comma grouping.
 * Requirement: "Use Tanzanian Shillings (TZS) and whole numbers. No decimal currency display is required."
 */
export function formatTZS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'TZS 0';
  }
  const rounded = Math.round(amount);
  return `TZS ${rounded.toLocaleString('en-US')}`;
}

/**
 * Format date in standard Swahili
 */
export function formatDateSwahili(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const monthsSwahili = [
    'Januari',
    'Februari',
    'Machi',
    'Aprili',
    'Mei',
    'Juni',
    'Julai',
    'Agosti',
    'Septemba',
    'Oktoba',
    'Novemba',
    'Desemba',
  ];

  const day = date.getDate();
  const month = monthsSwahili[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format datetime in Swahili
 */
export function formatDateTimeSwahili(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const datePart = formatDateSwahili(dateStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${datePart} Saa ${hours}:${minutes}`;
}

/**
 * Converts a number to Swahili words for official receipts
 * e.g. 50000 -> "Shilingi za Kitanzania Elfu Hamsini Tu"
 */
export function numberToWordsSwahili(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Shilingi za Kitanzania Sufuri Tu';

  const units = ['', 'Moja', 'Mbili', 'Tatu', 'Nne', 'Tano', 'Sita', 'Saba', 'Nane', 'Tisa'];
  const tens = ['', 'Kumi', 'Ishirini', 'Thelathini', 'Arobaini', 'Hamsini', 'Sitini', 'Sabini', 'Hamsini na Nane', 'Tisini'];
  
  // Custom helper for Swahili number phrasing
  function convertGroup(n: number): string {
    let out = '';
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;

    if (h > 0) {
      out += 'Mia ' + units[h] + ' ';
    }

    if (t > 0) {
      if (h > 0) out += 'na ';
      if (t === 1 && u === 0) {
        out += 'Kumi ';
      } else if (t === 1) {
        out += 'Kumi na ' + units[u] + ' ';
      } else {
        out += tens[t] + ' ';
        if (u > 0) {
          out += 'na ' + units[u] + ' ';
        }
      }
    } else if (u > 0) {
      if (h > 0) out += 'na ';
      out += units[u] + ' ';
    }

    return out.trim();
  }

  let words = '';
  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remaining = Math.round(num % 1000);

  if (millions > 0) {
    words += 'Milioni ' + convertGroup(millions) + ' ';
  }

  if (thousands > 0) {
    if (thousands >= 100 && thousands < 1000) {
      // e.g. laki moja = 100,000
      const lakis = Math.floor(thousands / 100);
      const subThousand = thousands % 100;
      words += 'Laki ' + units[lakis] + ' ';
      if (subThousand > 0) {
        words += 'na Elfu ' + convertGroup(subThousand) + ' ';
      }
    } else {
      words += 'Elfu ' + convertGroup(thousands) + ' ';
    }
  }

  if (remaining > 0) {
    if (words.length > 0) words += 'na ';
    words += convertGroup(remaining) + ' ';
  }

  return `Shilingi za Kitanzania ${words.trim()} Tu`;
}

/**
 * Returns difference in days between today and due date
 */
export function getDaysUntilDue(dueDateStr: string): {
  days: number;
  isOverdue: boolean;
  isToday: boolean;
  isApproaching: boolean;
  badgeText: string;
  badgeClass: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      days: overdueDays,
      isOverdue: true,
      isToday: false,
      isApproaching: false,
      badgeText: `Imechelewa kwa siku ${overdueDays}`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  }

  if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      isToday: true,
      isApproaching: true,
      badgeText: 'Mwisho ni Leo!',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    };
  }

  if (diffDays <= 7) {
    return {
      days: diffDays,
      isOverdue: false,
      isToday: false,
      isApproaching: true,
      badgeText: `Zimebaki siku ${diffDays}`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    days: diffDays,
    isOverdue: false,
    isToday: false,
    isApproaching: false,
    badgeText: `Zimebaki siku ${diffDays}`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

/**
 * Export data to authentic Excel (.xlsx) file
 */
export function exportToExcel(data: Record<string, any>[], fileName: string, sheetName: string = 'Takwimu') {
  if (!data || data.length === 0) {
    alert('Hakuna taarifa za kuhamisha kwenye Excel.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const keys = Object.keys(data[0] || {});
  const colWidths = keys.map((key) => {
    const maxValLength = data.reduce((max, row) => {
      const val = row[key] ? String(row[key]) : '';
      return Math.max(max, val.length);
    }, key.length);
    return { wch: Math.min(Math.max(maxValLength + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const validFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, validFileName);
}
