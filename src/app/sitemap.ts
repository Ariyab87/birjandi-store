import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kalaland24.com';
  return [
    { url: `${base}/fa`,           lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/en`,           lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/fa/retail`,    lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/en/retail`,    lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/fa/wholesale`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/en/wholesale`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/fa/contact`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/en/contact`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
