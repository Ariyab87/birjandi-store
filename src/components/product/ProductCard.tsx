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
          {product.price_on_request ? (
            <>
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {locale === 'fa' ? 'استعلام قیمت' : 'Price on Request'}
              </span>
              <a
                href={`https://wa.me/905338586763?text=${encodeURIComponent(locale === 'fa' ? `سلام، می‌خواهم قیمت "${name}" را بدانم` : `Hello, I'm interested in "${name}" — can you tell me the price?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs py-2 px-3 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                {locale === 'fa' ? 'واتساپ' : 'WhatsApp'}
              </a>
            </>
          ) : (
            <>
              {price != null ? (
                <span className="font-bold text-gold-600 text-sm">{formatPrice(price, locale)}</span>
              ) : (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  {locale === 'fa' ? 'استعلام قیمت' : 'Price on Request'}
                </span>
              )}
              <button
                disabled={!inStock || price == null}
                onClick={() => price != null && addItem({ id: product.id, name, price, quantity: 1, image: imgUrl })}
                className="btn-primary text-xs py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('add_to_basket')}
              </button>
            </>
          )}
        </div>

        {mode === 'wholesale' && product.min_wholesale_qty > 1 && (
          <p className="text-xs text-gray-400 mt-1">Min. {product.min_wholesale_qty} units</p>
        )}
      </div>
    </div>
  );
}
