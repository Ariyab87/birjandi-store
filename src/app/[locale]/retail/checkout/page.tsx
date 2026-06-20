import OrderForm from '@/components/order/OrderForm';

export const dynamic = 'force-dynamic';

export default function RetailCheckoutPage({ params: { locale } }: { params: { locale: string } }) {
  return <OrderForm locale={locale} type="retail" />;
}
