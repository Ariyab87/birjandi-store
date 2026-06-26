import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/api';

const BASE = 'https://kalaland24.com';

/** One sitemap entry per path with fa/en hreflang alternates (Google-recommended). */
function entry(
  path: string,
  priority: number,
  freq: MetadataRoute.Sitemap[0]['changeFrequency'] = 'weekly',
): MetadataRoute.Sitemap[0] {
  const suffix = path ? `/${path}` : '';
  return {
    url: `${BASE}/fa${suffix}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
    alternates: {
      languages: {
        fa: `${BASE}/fa${suffix}`,
        en: `${BASE}/en${suffix}`,
        'x-default': `${BASE}/fa${suffix}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    entry('', 1.0, 'daily'),
    entry('retail', 0.9, 'daily'),
    entry('wholesale', 0.8),
    entry('contact', 0.5, 'monthly'),
  ];

  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const { data } = await getProducts();
    productUrls = data.map(p => entry(`retail/${p.category}/${p.documentId}`, 0.8));
  } catch { /* Strapi not available at build time */ }

  return [...staticUrls, ...productUrls];
}
