// Formatting helpers safe to import from client components (no database code).

export function getImageUrl(url: string, quality: 'full' | 'thumb' = 'thumb'): string {
  // Inject Cloudinary quality transformation for better resolution
  if (url.includes('res.cloudinary.com')) {
    if (quality === 'full') {
      return url.replace('/upload/', '/upload/q_100,f_auto/');
    }
    return url.replace('/upload/', '/upload/q_85,f_auto/');
  }
  return url;
}

// Prices are stored in thousands of tomans (e.g. 30400 = 30,400,000 تومان)
export function formatPrice(price: number, locale: string): string {
  const actual = price * 1000;
  if (locale === 'fa') {
    return new Intl.NumberFormat('fa-IR').format(actual) + ' تومان';
  }
  return new Intl.NumberFormat('en-US').format(actual) + ' T';
}
