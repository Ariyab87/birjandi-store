import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/db';
import { uploadImage, cloudinaryConfigured } from '@/lib/cloudinary';

export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // Vercel request bodies are capped at 4.5MB

// POST multipart: file, folder? — header x-admin-password
export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers.get('x-admin-password'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary تنظیم نشده است' }, { status: 500 });
  }
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) return NextResponse.json({ error: 'فایلی ارسال نشد' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'فقط تصویر مجاز است' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'حجم تصویر بیش از ۴ مگابایت است' }, { status: 400 });

    const folder = form.get('folder') === 'articles' ? 'kalaland24/articles' : 'kalaland24/products';
    return NextResponse.json({ image: await uploadImage(file, folder) });
  } catch (err) {
    console.error('upload error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'خطا در آپلود' }, { status: 500 });
  }
}
