export const BASE_URL = 'https://kalaland24.com';

export function normalizeFarsi(text: string): string {
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه');
}

export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  const normalized = normalizeFarsi(text);
  return normalized.length > max ? normalized.slice(0, max - 3) + '...' : normalized;
}

export function buildTitle(name: string, locale: string): string {
  if (locale === 'fa') return `${name} | خرید آنلاین | کالالند`;
  return `${name} | Buy Online | Kalaland`;
}

export function buildDescription(desc: string | null | undefined, name: string, locale: string): string {
  if (desc && desc.length > 30) return truncate(desc, 155);
  if (locale === 'fa') return `خرید ${name} با بهترین قیمت از کالالند — فروش خرده و عمده لوازم خانگی`;
  return `Buy ${name} at the best price from Kalaland — retail and wholesale home appliances`;
}

export function hreflangAlternates(path: string) {
  return {
    canonical: `${BASE_URL}/fa/${path}`,
    languages: {
      'fa': `${BASE_URL}/fa/${path}`,
      'en': `${BASE_URL}/en/${path}`,
      'x-default': `${BASE_URL}/fa/${path}`,
    },
  };
}
