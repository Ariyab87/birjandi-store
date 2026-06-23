import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/api';

const BASE = 'https://kalaland24.com';

function urls(path: string, priority: number, freq: MetadataRoute.Sitemap[0]['changeFrequency'] = 'weekly') {
  return ['fa', 'en'].map(locale => ({
    url: `${BASE}/${locale}${path ? `/${path}` : ''}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls = [
    ...urls('', 1.0),
    ...urls('retail', 0.9),
    ...urls('wholesale', 0.8),
    ...urls('contact', 0.5, 'monthly'),
  ];

  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const { data } = await getProducts();
    productUrls = data.flatMap(p =>
      ['fa', 'en'].map(locale => ({
        url: `${BASE}/${locale}/retail/${p.category}/${p.documentId}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    );
  } catch { /* Strapi not available at build time */ }

  return [...staticUrls, ...productUrls];
}
