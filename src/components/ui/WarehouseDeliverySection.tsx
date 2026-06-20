const textBlock = (label: string, heading: string, paragraph: string) => (
  <div className="flex flex-col justify-center" style={{ borderLeft: '3px solid #D4A017', paddingLeft: '28px' }}>
    <span style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#D4A017', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>
      {label}
    </span>
    <h3 style={{ fontSize: '28px', fontWeight: 500, color: '#0e2642', lineHeight: 1.3, marginBottom: '16px' }}>
      {heading}
    </h3>
    <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#6b7280' }}>
      {paragraph}
    </p>
  </div>
);

const videoBlock = (src: string, title: string) => (
  <div className="w-full">
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      title={title}
      style={{ borderRadius: '12px', maxHeight: '320px', width: '100%', objectFit: 'cover', display: 'block' }}
    />
  </div>
);

export default function WarehouseDeliverySection({ locale }: { locale: string }) {
  const fa = locale === 'fa';

  return (
    <section style={{ backgroundColor: '#f9f6f0', padding: '80px 0' }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-20">

        {/* Row 1 — Warehouse: video left, text right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {videoBlock('/warehouse.mp4', 'Warehouse')}
          {textBlock(
            fa ? 'انبار ما' : 'OUR WAREHOUSE',
            fa ? 'آماده برای هر سفارشی' : 'Stocked and ready for any order',
            fa
              ? 'انبار ما هزاران محصول خانگی، لوازم آشپزخانه و تجهیزات پذیرایی را در خود جای داده است — همیشه موجود و آماده ارسال. چه یک قطعه نیاز داشته باشید چه یک سفارش عمده، ما توانایی پاسخگویی سریع و مطمئن به شما را داریم.'
              : 'Our warehouse holds thousands of household products, kitchen appliances, and catering supplies — always in stock and ready to ship. Whether you need one item or a full bulk order, we have the capacity to fulfil it quickly and reliably.'
          )}
        </div>

        {/* Row 2 — Delivery: text left, video right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            {textBlock(
              fa ? 'ارسال سریع' : 'FAST DELIVERY',
              fa ? 'مستقیم تا در خانه شما' : 'We bring it straight to your door',
              fa
                ? 'از لحظه‌ای که سفارش می‌دهید، تیم ارسال ما اطمینان می‌دهد محصولات شما به صورت ایمن و به موقع به دستتان برسد. ما همه چیز را مدیریت می‌کنیم — بسته‌بندی، لجستیک و تحویل — تا شما روی کسب‌وکارتان تمرکز کنید.'
              : 'From the moment you place your order, our delivery team ensures your products arrive safely and on time. We handle everything — packaging, logistics, and drop-off — so you can focus on running your business.'
            )}
          </div>
          <div className="order-1 md:order-2">
            {videoBlock('/delivery.mp4', 'Delivery')}
          </div>
        </div>

      </div>
    </section>
  );
}
