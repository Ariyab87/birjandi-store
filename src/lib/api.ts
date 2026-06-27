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
  images: Array<{
    id: number;
    url: string;
    formats?: { thumbnail?: { url: string }; medium?: { url: string } };
  }>;
}

interface StrapiList<T> {
  data: T[];
  meta: { pagination: { total: number } };
}

export async function getProducts(filters: Record<string, string> = {}): Promise<StrapiList<Product>> {
  return fetchAPI<StrapiList<Product>>('/products', { populate: 'images', 'pagination[limit]': '500', ...filters });
}

export async function getProduct(id: string): Promise<{ data: Product }> {
  return fetchAPI<{ data: Product }>(`/products/${id}`, { populate: 'images' });
}

export async function getFeaturedProducts(): Promise<StrapiList<Product>> {
  return fetchAPI<StrapiList<Product>>('/products', {
    populate: 'images',
    'filters[featured][$eq]': 'true',
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
