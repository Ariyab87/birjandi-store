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
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gold-400 hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Image */}
      <Link href={`/${locale}/${mode}/${product.category}/${product.documentId}`} className="relative block overflow-hidden" style={{ height: '200px', backgroundColor: '#f7f7f7' }}>
        {image ? (
          <Image
            src={imgUrl}
            alt={name}
            fill
            className="object-contain p-4 group-hover:scale-108 transition-transform duration-500"
            style={{ transform: 'scale(1)', transitionProperty: 'transform' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">📦</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {product.featured && (
            <span className="bg-gold-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              {locale === 'fa' ? 'ویژه' : 'Featured'}
            </span>
          )}
          {!inStock && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              {t('out_of_stock')}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {/* Brand tag */}
        <span className="inline-block text-[10px] font-semibold text-navy-600 bg-navy-50 border border-navy-100 px-2 py-0.5 rounded-full mb-1.5 self-start">
          {product.brand}
        </span>

        <Link href={`/${locale}/${mode}/${product.category}/${product.documentId}`} className="flex-1">
          <h3 className="font-semibold text-gray-800 hover:text-gold-600 transition-colors line-clamp-2 text-sm leading-snug">
            {name}
          </h3>
        </Link>

        {/* Price + action */}
        <div className="mt-3">
          {product.price_on_request || price == null ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-lg">
                {locale === 'fa' ? 'استعلام قیمت' : 'Price on Request'}
              </span>
              <a
                href={`https://wa.me/905338586763?text=${encodeURIComponent(locale === 'fa' ? `سلام، می‌خواهم قیمت "${name}" را بدانم` : `Hello, I'd like the price for "${name}"`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-[11px] py-1.5 px-2.5 rounded-lg transition-colors shrink-0"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                {locale === 'fa' ? 'واتساپ' : 'WhatsApp'}
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-gold-600 text-sm">{formatPrice(price, locale)}</span>
              <button
                disabled={!inStock}
                onClick={() => addItem({ id: product.id, name, price, quantity: 1, image: imgUrl })}
                className="shrink-0 bg-navy-700 hover:bg-navy-800 text-white text-[11px] py-1.5 px-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('add_to_basket')}
              </button>
            </div>
          )}
        </div>

        {mode === 'wholesale' && product.min_wholesale_qty > 1 && (
          <p className="text-[10px] text-gray-400 mt-1.5">
            {locale === 'fa' ? `حداقل ${product.min_wholesale_qty} عدد` : `Min. ${product.min_wholesale_qty} units`}
          </p>
        )}
      </div>
    </div>
  );
}
