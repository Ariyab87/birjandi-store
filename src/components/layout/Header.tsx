'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import BasketDrawer from '../basket/BasketDrawer';
import { useBasket } from '../basket/BasketContext';

export default function Header() {
  const t = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const otherLocale = locale === 'fa' ? 'en' : 'fa';
  const [basketOpen, setBasketOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useBasket();

  const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { href: `/${locale}`,                  label: t('home') },
    { href: `/${locale}#about`,            label: locale === 'fa' ? 'درباره ما' : 'About Us' },
    { href: `/${locale}#featured`,         label: locale === 'fa' ? 'محصولات ویژه' : 'Featured Products' },
    { href: `/${locale}/retail`,           label: t('retail'), primary: true },
    { href: `/${locale}/blog`,             label: locale === 'fa' ? 'مجله' : 'Magazine' },
    { href: `/${locale}/contact`,          label: t('contact') },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50" style={{ background: 'rgba(10, 10, 15, 0.45)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
            <div className="rounded-full ring-1 ring-gold-500/40 group-hover:ring-gold-500 transition-all overflow-hidden shrink-0" style={{ width: 32, height: 32 }}>
              <Image src="/logo.png" alt="کالالند۲۴" width={32} height={32} className="w-full h-full object-cover" />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative pb-1 transition-colors hover:text-gold-400 ${
                  link.primary ? 'font-bold' : ''
                } ${
                  pathname === link.href
                    ? 'text-gold-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold-400 after:rounded-full'
                    : link.primary
                      ? 'text-white hover:text-gold-400'
                      : 'text-white/80 hover:text-gold-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <Link
              href={newPath}
              className="text-xs bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-3 py-1 rounded-full transition-colors border border-white/10"
            >
              {otherLocale === 'fa' ? 'فارسی' : 'English'}
            </Link>

            {/* Basket */}
            <button
              onClick={() => setBasketOpen(true)}
              className="relative p-2 text-white/80 hover:text-gold-400 transition-colors"
              aria-label="Basket"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-white/80 hover:text-gold-400 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu — slides down */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? 'max-h-96 border-t border-white/10' : 'max-h-0'
          }`}
        >
          <nav className="flex flex-col px-4 py-3 gap-1" style={{ background: 'rgba(10, 10, 20, 0.95)' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 px-4 rounded-lg text-sm transition-colors ${
                  link.primary ? 'font-bold' : 'font-medium'
                } ${
                  pathname === link.href
                    ? 'bg-gold-500/20 text-gold-400'
                    : link.primary
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-white/10 text-white/80'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Language toggle in mobile menu */}
            <Link
              href={newPath}
              onClick={() => setMenuOpen(false)}
              className="py-3 px-4 rounded-lg text-sm font-medium text-white/50 hover:bg-white/10 transition-colors mt-1 border-t border-white/10 pt-4"
            >
              🌐 {otherLocale === 'fa' ? 'فارسی' : 'English'}
            </Link>
          </nav>
        </div>
      </header>

      <BasketDrawer open={basketOpen} onClose={() => setBasketOpen(false)} />

      {/* Backdrop for mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
