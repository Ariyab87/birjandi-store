import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['fa', 'en'],
  defaultLocale: 'fa',
  localePrefix: 'always',
  // Iran is the primary market — always land visitors on the Farsi site
  // regardless of their device/browser language. Without this, next-intl
  // auto-detects the browser's Accept-Language and can silently redirect
  // English-language devices straight to /en. Visitors can still switch
  // manually via the site's own language toggle.
  localeDetection: false,
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
