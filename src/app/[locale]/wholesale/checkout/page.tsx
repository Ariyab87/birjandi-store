import OrderForm from '@/components/order/OrderForm';

export const dynamic = 'force-dynamic';

export default function WholesaleCheckoutPage({ params: { locale } }: { params: { locale: string } }) {
  return <OrderForm locale={locale} type="wholesale" />;
}
