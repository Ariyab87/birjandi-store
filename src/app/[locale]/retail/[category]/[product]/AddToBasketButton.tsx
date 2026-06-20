'use client';

import { useBasket } from '@/components/basket/BasketContext';

interface Props {
  product: { id: number; name: string; price: number };
  locale: string;
  inStock: boolean;
}

export default function AddToBasketButton({ product, locale, inStock }: Props) {
  const { addItem } = useBasket();

  return (
    <button
      disabled={!inStock}
      onClick={() => addItem({ ...product, quantity: 1 })}
      className="btn-gold w-full py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {locale === 'fa' ? 'افزودن به سبد خرید' : 'Add to Basket'}
    </button>
  );
}
