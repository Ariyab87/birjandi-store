'use client';

import { useState } from 'react';
import { useBasket } from '../basket/BasketContext';
import { formatPrice } from '@/lib/api';

interface Props {
  locale: string;
  type: 'retail' | 'wholesale';
}

export default function OrderForm({ locale, type }: Props) {
  const { state, total, clearBasket } = useBasket();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    businessName: '',
    email: '',
    notes: '',
  });

  const fa = locale === 'fa';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, customer: form, items: state.items, total }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      clearBasket();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-navy-700 mb-2">
          {fa ? 'سفارش ثبت شد!' : 'Order Placed!'}
        </h2>
        <p className="text-gray-500">
          {fa
            ? 'سفارش شما با موفقیت ثبت شد. به زودی با شما تماس می‌گیریم.'
            : 'Your order has been submitted. We will contact you shortly.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <h1 className="section-title">{fa ? 'ثبت سفارش' : 'Place Your Order'}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label={fa ? 'نام و نام خانوادگی' : 'Full Name'}
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <Field
            label={fa ? 'شماره تلفن' : 'Phone'}
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            required
            type="tel"
          />
          <Field
            label={fa ? 'آدرس' : 'Address'}
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            required
            textarea
          />
          {type === 'wholesale' && (
            <Field
              label={fa ? 'نام کسب‌وکار' : 'Business Name'}
              value={form.businessName}
              onChange={(v) => setForm({ ...form, businessName: v })}
            />
          )}
          <Field
            label={fa ? 'ایمیل (اختیاری)' : 'Email (optional)'}
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
          />
          <Field
            label={fa ? 'توضیحات' : 'Notes'}
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            textarea
          />

          {status === 'error' && (
            <p className="text-red-500 text-sm">
              {fa ? 'خطا در ثبت سفارش. لطفاً دوباره امتحان کنید.' : 'Error. Please try again.'}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || state.items.length === 0}
            className="btn-gold w-full py-4 text-lg disabled:opacity-50"
          >
            {status === 'loading'
              ? (fa ? 'در حال ارسال...' : 'Sending...')
              : (fa ? 'ارسال سفارش' : 'Submit Order')}
          </button>
        </form>
      </div>

      <div>
        <h2 className="section-title">{fa ? 'خلاصه سفارش' : 'Order Summary'}</h2>
        <div className="card p-4 space-y-3">
          {state.items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              {fa ? 'سبد خرید خالی است' : 'Your basket is empty'}
            </p>
          ) : (
            <>
              {state.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="flex-1">{item.name} × {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity, locale)}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>{fa ? 'جمع کل' : 'Total'}</span>
                <span className="text-gold-600">{formatPrice(total, locale)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  textarea?: boolean;
}) {
  const cls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea
          className={cls}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          className={cls}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </div>
  );
}
