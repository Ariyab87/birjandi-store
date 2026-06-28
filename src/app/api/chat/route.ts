import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/api';

const CATEGORY_FA: Record<string, string> = {
  electric:  'برقی',
  metal:     'فلزی',
  melamine:  'ملامین',
  glass:     'شکستنی / شیشه‌ای',
  porcelain: 'چینی',
  teflon:    'تفلون',
  steel:     'استیل',
  ceramic:   'سرامیک',
  plastic:   'پلاستیک',
  crystal:   'کریستال',
  copper:    'مسی',
  cast_iron: 'چدن',
};

function formatPrice(n: number): string {
  return (n * 1000).toLocaleString('fa-IR') + ' تومان';
}

async function buildProductCatalog(): Promise<string> {
  try {
    const { data } = await getProducts({}, 1, 500);
    if (!data.length) return 'در حال حاضر محصولی در انبار ثبت نشده است.';

    const lines = data.map(p => {
      const price = (p.price_on_request || p.retail_price == null)
        ? 'قیمت استعلامی'
        : formatPrice(p.retail_price);
      const wholesale = (p.price_on_request || p.wholesale_price == null)
        ? ''
        : ` | قیمت عمده: ${formatPrice(p.wholesale_price)} (حداقل ${p.min_wholesale_qty} عدد)`;
      const stock = p.stock_status === 'in_stock' ? '✅ موجود' : '❌ ناموجود';
      const cat = CATEGORY_FA[p.category] || p.category;
      const desc = p.description_fa ? ` | توضیح: ${p.description_fa.slice(0, 80)}` : '';
      return `• ${p.name_fa} | برند: ${p.brand} | دسته: ${cat} | قیمت خرده: ${price}${wholesale} | ${stock}${desc}`;
    });

    return lines.join('\n');
  } catch {
    return 'اتصال به انبار محصولات در حال حاضر در دسترس نیست.';
  }
}

function buildSystemPrompt(catalog: string): string {
  return `
تو «کیا» هستی — دستیار هوشمند و متخصص فروشگاه آنلاین **کالالند** (kalaland24.com).
کالالند یک فروشگاه ایرانی با بیش از ۳۰ سال تجربه در زمینه لوازم خانگی، ظروف آشپزخانه، لوازم پذیرایی و تجهیزات صنعتی است که به سراسر ایران ارسال می‌کند.

---

## شخصیت تو
- گرم، صمیمی و حرفه‌ای — مثل یک فروشنده باتجربه که واقعاً کمک می‌کند
- کاملاً به محصولات تسلط داری و می‌توانی مقایسه دقیق انجام دهی
- وقتی مشتری سوال محصول می‌پرسد، از لیست واقعی محصولات زیر پاسخ می‌دهی
- هرگز قیمت یا مشخصاتی که در لیست نیست اختراع نمی‌کنی
- اگر محصولی در لیست نبود صادقانه می‌گویی: "این محصول در حال حاضر در موجودی ما نیست — می‌توانید با ما تماس بگیرید تا راهنمایی کنیم."

---

## محصولات فعلی کالالند (لیست واقعی از انبار)
${catalog}

---

## دسته‌بندی‌ها
برقی | فلزی | ملامین | شکستنی/شیشه‌ای | چینی | تفلون | استیل | سرامیک | پلاستیک | کریستال | مسی | چدن

---

## اطلاعات فروشگاه
- **آدرس سایت:** kalaland24.com
- **تلفن ۱:** ۰۹۹۳ ۴۶۴ ۲۴۵۵
- **تلفن ۲:** ۰۹۱۳ ۱۴۴ ۴۰۲۱
- **واتساپ:** +905338586763
- **ایمیل:** ariyabirjandi87@gmail.com
- **پشتیبانی:** ۲۴ ساعته، ۷ روز هفته
- **ارسال:** سراسر ایران — همه ۳۱ استان
- **پرداخت:** بعد از ثبت سفارش، تیم ما تماس می‌گیرد — هنوز درگاه آنلاین نداریم
- **ضمانت:** تمام محصولات اصل با گارانتی معتبر

## فروش عمده
- قیمت ویژه برای کافه، رستوران، هتل، باشگاه و دفتر کار
- حداقل تعداد سفارش هر محصول در لیست بالا مشخص است
- برای سفارش عمده بزرگ با ما تماس بگیرید

---

## قوانین پاسخ‌دهی
1. همیشه به فارسی روان و بدون غلط دیکته‌ای پاسخ بده
2. اگر کاربر اسم محصولی پرسید، لیست بالا را بررسی کن و نتیجه دقیق بگو
3. اگر چند محصول مرتبط داری، همه را با قیمت ذکر کن
4. اگر محصول ناموجود است، پیشنهاد تماس برای استعلام بده
5. هرگز بیش از ۴ پاراگراف کوتاه ننویس
6. در پایان هر پاسخ یک جمله دلسوزانه اضافه کن مثل «اگر سوال دیگری دارید خوشحال می‌شم کمک کنم 🙂»
7. اگر کاربر قیمت خرید عمده پرسید، قیمت عمده و حداقل تعداد را از لیست بگو
8. اگر محصولی «قیمت استعلامی» دارد، مشتری را به واتساپ هدایت کن: wa.me/905338586763
9. عدد را به فارسی بنویس: ۱،۵۰۰،۰۰۰ نه 1500000
10. اگر کاربر به انگلیسی نوشت، به انگلیسی پاسخ بده — در غیر این صورت فقط فارسی
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const [catalog] = await Promise.all([buildProductCatalog()]);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt(catalog) },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.4,
    });

    const reply = response.choices[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
