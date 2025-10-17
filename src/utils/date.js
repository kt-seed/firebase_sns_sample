const RELATIVE_INTERVALS = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 }
];

const rtf = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' });

export function formatRelativeTime(value) {
  const target = value instanceof Date ? value : new Date(value);
  const diff = target.getTime() - Date.now();
  const absDiff = Math.abs(diff);

  for (const interval of RELATIVE_INTERVALS) {
    if (absDiff >= interval.ms || interval.unit === 'second') {
      const delta = Math.round(diff / interval.ms);
      return rtf.format(delta, interval.unit);
    }
  }

  return rtf.format(0, 'second');
}

export function formatDateTime(value) {
  const target = value instanceof Date ? value : new Date(value);
  return target.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
