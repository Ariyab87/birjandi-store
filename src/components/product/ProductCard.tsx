'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Product, formatPrice, getImageUrl } from '@/lib/api';
import { useBasket } from '../basket/BasketContext';

interface Props {
  product: Product;
  mode: 'retail' | 'wholesale';
}

export default function ProductCard({ product, mode }: Props) {
  const t = useTranslations('retail');
  const params = useParams();
  const locale = params.locale as string;
  const { addItem } = useBasket();

  const name = locale === 'fa' ? product.name_fa : product.name_en;
  const price = mode === 'retail' ? product.retail_price : product.wholesale_price;
  const inStock = product.stock_status === 'in_stock';
  const image = product.images?.[0];
  const imgUrl = image
    ? getImageUrl(image.formats?.medium?.url || image.url, 'thumb')
    : '/placeholder.jpg';

  return (
    <div className="card group hover:shadow-md transition-shadow">
      <Link href={`/${locale}/${mode}/${product.category}/${product.documentId}`}>
        <div className="relative overflow-hidden" style={{ height: '160px', backgroundColor: '#f8f8f8' }}>
          {image ? (
            <Image
              src={imgUrl}
              alt={name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
          )}
          {!inStock && (
            <span className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
              {t('out_of_stock')}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1">{product.brand}</p>
        <Link href={`/${locale}/${mode}/${product.category}/${product.documentId}`}>
          <h3 className="font-semibold text-navy-700 hover:text-gold-600 transition-colors line-clamp-2 mb-2">
            {name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-gold-600 text-sm">{formatPrice(price, locale)}</span>
          <button
            disabled={!inStock}
            onClick={() => addItem({ id: product.id, name, price, quantity: 1, image: imgUrl })}
            className="btn-primary text-xs py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('add_to_basket')}
          </button>
        </div>

        {mode === 'wholesale' && product.min_wholesale_qty > 1 && (
          <p className="text-xs text-gray-400 mt-1">Min. {product.min_wholesale_qty} units</p>
        )}
      </div>
    </div>
  );
}
