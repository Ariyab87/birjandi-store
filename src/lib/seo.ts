export const BASE_URL = 'https://kalaland24.com';
export const OG_IMAGE = `${BASE_URL}/logo.png`;

export const SITE_NAME = { fa: 'کالالند', en: 'Kalaland' };

// Social profiles — used for Organization schema `sameAs` and contact
export const SOCIAL_LINKS = [
  'https://wa.me/905338586763',
  'https://t.me/+989901443513',
];

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
  if (locale === 'fa') return `خرید ${name} | قیمت و مشخصات | کالالند`;
  return `Buy ${name} | Price & Details | Kalaland`;
}

export function buildDescription(desc: string | null | undefined, name: string, locale: string): string {
  if (desc && desc.length > 30) return truncate(desc, 155);
  if (locale === 'fa')
    return `خرید ${name} با بهترین قیمت از کالالند. موجود در انبار، ارسال سریع به سراسر ایران. ضمانت اصالت کالا.`;
  return `Buy ${name} at the best price from Kalaland. In stock, fast delivery across Iran. Authenticity guaranteed.`;
}

/**
 * Per-locale canonical + hreflang alternates.
 * Each locale is self-canonical so both FA and EN pages get indexed independently.
 */
export function hreflangAlternates(path: string, locale: string = 'fa') {
  const suffix = path ? `/${path}` : '';
  return {
    canonical: `${BASE_URL}/${locale}${suffix}`,
    languages: {
      'fa': `${BASE_URL}/fa${suffix}`,
      'en': `${BASE_URL}/en${suffix}`,
      'x-default': `${BASE_URL}/fa${suffix}`,
    },
  };
}

/** Default Open Graph / Twitter share image set. */
export function ogImages(alt: string) {
  return [{ url: OG_IMAGE, width: 1200, height: 1200, alt }];
}
