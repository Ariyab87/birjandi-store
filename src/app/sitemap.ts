import { MetadataRoute } from 'next';
import { getProducts, getArticles } from '@/lib/api';
import { RETAIL_CATEGORIES, WHOLESALE_BUSINESS_TYPES } from '@/lib/utils';

const BASE = 'https://kalaland24.com';

/** One sitemap entry per path with fa/en hreflang alternates (Google-recommended). */
function entry(
  path: string,
  priority: number,
  freq: MetadataRoute.Sitemap[0]['changeFrequency'] = 'weekly',
  lastModified: Date = new Date(),
): MetadataRoute.Sitemap[0] {
  const suffix = path ? `/${path}` : '';
  return {
    url: `${BASE}/fa${suffix}`,
    lastModified,
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
    ...RETAIL_CATEGORIES.map(c => entry(`retail/${c.key}`, 0.85, 'daily')),
    entry('wholesale', 0.8),
    ...WHOLESALE_BUSINESS_TYPES.map(b => entry(`wholesale/${b.key}`, 0.7)),
    entry('blog', 0.7, 'weekly'),
    entry('contact', 0.5, 'monthly'),
  ];

  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    const { data } = await getArticles(1, 100);
    articleUrls = data.map(a => entry(`blog/${a.slug}`, 0.7, 'monthly', new Date(a.updatedAt)));
  } catch { /* Strapi not available */ }

  let productUrls: MetadataRoute.Sitemap = [];
  try {
    // Strapi caps pageSize at 100 — paginate to include every product
    for (let page = 1; ; page++) {
      const { data, meta } = await getProducts({}, page, 100);
      productUrls.push(...data.map(p =>
        entry(`retail/${p.category}/${p.documentId}`, 0.8, 'weekly', p.updatedAt ? new Date(p.updatedAt) : new Date()),
      ));
      if (page >= meta.pagination.pageCount) break;
    }
  } catch { /* Strapi not available at build time */ }

  return [...staticUrls, ...articleUrls, ...productUrls];
}
