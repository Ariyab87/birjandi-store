const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'localhost', port: '1337' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent the site being framed by another origin (clickjacking).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Stop browsers guessing content types away from what's declared.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak the full URL (query strings, product IDs) to third-party
          // link targets; still send origin+path for same-site navigation.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nothing on this site uses camera/mic/geolocation — deny by default.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
