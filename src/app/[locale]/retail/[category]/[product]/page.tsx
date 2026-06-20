import { getProduct, formatPrice, getImageUrl } from '@/lib/api';
import Image from 'next/image';
import AddToBasketButton from './AddToBasketButton';

export default async function ProductPage({
  params: { locale, product: productId },
}: {
  params: { locale: string; category: string; product: string };
}) {
  let product;
  try {
    const res = await getProduct(productId);
    product = res.data;
  } catch {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
        Product not found or Strapi is not connected.
      </div>
    );
  }

  const name = locale === 'fa' ? product.name_fa : product.name_en;
  const description = locale === 'fa' ? product.description_fa : product.description_en;
  const images = product.images || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm aspect-square relative">
          {images[0] ? (
            <Image
              src={getImageUrl(images[0].url, 'full')}
              alt={name}
              fill
              quality={100}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-8xl">📦</div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">{product.brand}</p>
          <h1 className="text-3xl font-bold text-navy-700 mb-4">{name}</h1>

          <div className="bg-cream rounded-xl p-4 mb-6">
            <p className="text-2xl font-bold text-gold-600">
              {formatPrice(product.retail_price, locale)}
            </p>
            <span className={`text-sm mt-1 inline-block px-2 py-0.5 rounded ${
              product.stock_status === 'in_stock'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {product.stock_status === 'in_stock'
                ? (locale === 'fa' ? 'موجود' : 'In Stock')
                : (locale === 'fa' ? 'ناموجود' : 'Out of Stock')}
            </span>
          </div>

          <AddToBasketButton
            product={{ id: product.id, name, price: product.retail_price }}
            locale={locale}
            inStock={product.stock_status === 'in_stock'}
          />

          {description && (
            <div className="mt-8">
              <h2 className="font-semibold text-navy-700 mb-2">
                {locale === 'fa' ? 'توضیحات' : 'Description'}
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
