'use client';

import { useTranslations } from 'next-intl';
import { useBasket } from './BasketContext';
import { formatPrice } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BasketDrawer({ open, onClose }: Props) {
  const t = useTranslations('basket');
  const { state, removeItem, updateQty, total } = useBasket();
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 ${locale === 'fa' ? 'left-0' : 'right-0'} h-full w-80 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : locale === 'fa' ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b bg-navy-700 text-white">
          <h2 className="text-lg font-bold">{t('title')}</h2>
          <button onClick={onClose} className="text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.items.length === 0 ? (
            <p className="text-center text-gray-400 mt-16">{t('empty')}</p>
          ) : (
            state.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-gold-600 text-sm">{formatPrice(item.price, locale)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                    onClick={() => item.quantity > 1 ? updateQty(item.id, item.quantity - 1) : removeItem(item.id)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="text-red-400 hover:text-red-600 text-xs"
                  onClick={() => removeItem(item.id)}
                >
                  {t('remove')}
                </button>
              </div>
            ))
          )}
        </div>

        {state.items.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex justify-between mb-4 font-bold">
              <span>{t('total')}</span>
              <span className="text-gold-600">{formatPrice(total, locale)}</span>
            </div>
            <button
              className="btn-gold w-full"
              onClick={() => {
                onClose();
                router.push(`/${locale}/${state.type}/checkout`);
              }}
            >
              {t('checkout')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
