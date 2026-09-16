import { createHash } from 'crypto';
import type { ProductImage } from '@/lib/api';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || '';
const KEY = process.env.CLOUDINARY_API_KEY || '';
const SECRET = process.env.CLOUDINARY_API_SECRET || '';

export const cloudinaryConfigured = () => !!(CLOUD && KEY && SECRET);

/**
 * Signed upload to Cloudinary. `file` is a Blob/File or a remote URL string
 * (Cloudinary fetches URLs itself). Returns the stored image.
 */
export async function uploadImage(file: Blob | string, folder = 'kalaland24'): Promise<ProductImage> {
  if (!cloudinaryConfigured()) throw new Error('Cloudinary is not configured');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${SECRET}`)
    .digest('hex');

  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  form.append('timestamp', timestamp);
  form.append('api_key', KEY);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `Cloudinary ${res.status}`);
  return { url: json.secure_url, width: json.width, height: json.height };
}
