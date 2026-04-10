export function formatDate(
  date: Date | string | number | undefined,
  locale = 'en-US',
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts,
    }).format(new Date(date));
  } catch {
    return '';
  }
}

export function formatTime(date: Date | string | number | undefined, locale = 'en-US') {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return '';
  }
}
