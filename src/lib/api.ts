const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

async function fetchAPI<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const url = `${STRAPI_URL}/api${path}${query ? `?${query}` : ''}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Strapi error: ${res.status}`);
  return res.json();
}

// Strapi v5 — fields are flat (no "attributes" wrapper)
export interface Product {
  id: number;
  documentId: string;
  name_fa: string;
  name_en: string;
  brand: string;
  retail_price: number | null;
  wholesale_price: number | null;
  min_wholesale_qty: number;
  category: string;
  business_types: string[] | null;
  description_fa: string | null;
  description_en: string | null;
  stock_status: 'in_stock' | 'out_of_stock';
  featured: boolean;
  price_on_request: boolean;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  no_index: boolean;
  updatedAt?: string;
  images: Array<{
    id: number;
    url: string;
    formats?: { thumbnail?: { url: string }; medium?: { url: string } };
  }>;
}

interface StrapiList<T> {
  data: T[];
  meta: { pagination: { total: number; page: number; pageSize: number; pageCount: number } };
}

export async function getProducts(
  filters: Record<string, string> = {},
  page = 1,
  pageSize = 20,
): Promise<StrapiList<Product>> {
  return fetchAPI<StrapiList<Product>>('/products', {
    populate: 'images',
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
    ...filters,
  });
}

export async function getProduct(id: string): Promise<{ data: Product }> {
  return fetchAPI<{ data: Product }>(`/products/${id}`, { populate: 'images' });
}

// Homepage "محصولات ویژه" — newest electric appliances that have a price
export async function getFeaturedProducts(): Promise<StrapiList<Product>> {
  return fetchAPI<StrapiList<Product>>('/products', {
    populate: 'images',
    'filters[category][$eq]': 'electric',
    'filters[retail_price][$notNull]': 'true',
    'filters[price_on_request][$ne]': 'true',
    sort: 'createdAt:desc',
    'pagination[limit]': '8',
  });
}

export async function getProductsByCategory(category: string): Promise<StrapiList<Product>> {
  return fetchAPI<StrapiList<Product>>('/products', {
    populate: 'images',
    'filters[category][$eq]': category,
  });
}

export async function getProductsByBusinessType(businessType: string): Promise<StrapiList<Product>> {
  return fetchAPI<StrapiList<Product>>('/products', {
    populate: 'images',
    'filters[business_types][$containsi]': businessType,
  });
}

export function getImageUrl(url: string, quality: 'full' | 'thumb' = 'thumb'): string {
  if (!url.startsWith('http')) return `${STRAPI_URL}${url}`;
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

// ── Blog articles (مجله) ──────────────────────────────────────────────────
export interface Article {
  id: number;
  documentId: string;
  title_fa: string;
  slug: string;
  excerpt_fa: string | null;
  content_fa: string;
  seo_title: string | null;
  seo_description: string | null;
  cover: { url: string; formats?: { medium?: { url: string } } } | null;
  publishedAt: string;
  updatedAt: string;
}

export async function getArticles(page = 1, pageSize = 12): Promise<StrapiList<Article>> {
  return fetchAPI<StrapiList<Article>>('/articles', {
    populate: 'cover',
    sort: 'publishedAt:desc',
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const res = await fetchAPI<StrapiList<Article>>('/articles', {
    populate: 'cover',
    'filters[slug][$eq]': slug,
  });
  return res.data[0] || null;
}

// ── Reviews ──────────────────────────────────────────────────────────────
// Reviews aren't publicly readable in Strapi (no permissions granted), so
// this reads with the server-only STRAPI_API_TOKEN — safe here since api.ts
// review functions are only ever called from server components.
export interface Review {
  id: number;
  documentId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getApprovedReviews(
  productDocumentId: string,
): Promise<{ reviews: Review[]; average: number; count: number }> {
  const token = process.env.STRAPI_API_TOKEN || '';
  try {
    const params = new URLSearchParams({
      'filters[product_document_id][$eq]': productDocumentId,
      'filters[approved][$eq]': 'true',
      'sort[0]': 'createdAt:desc',
      'pagination[limit]': '100',
    });
    const res = await fetch(`${STRAPI_URL}/api/reviews?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      next: { revalidate: 60 },
    });
    if (!res.ok) return { reviews: [], average: 0, count: 0 };
    const json = await res.json();
    const reviews = (json.data || []) as Review[];
    const count = reviews.length;
    const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { reviews, average, count };
  } catch {
    return { reviews: [], average: 0, count: 0 };
  }
}
