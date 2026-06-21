import { Resend } from 'resend';

const RECIPIENT = process.env.ORDER_RECIPIENT_EMAIL || 'owner@birjandi.com';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(process.env.RESEND_API_KEY);
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  type: 'retail' | 'wholesale';
  customer: {
    name: string;
    phone: string;
    address: string;
    businessName?: string;
    email?: string;
    notes?: string;
  };
  items: OrderItem[];
  total: number;
  orderId: string;
}

export async function sendOrderEmails(order: OrderData) {
  const resend = getResend();
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.price.toLocaleString()} IRR</td>
        </tr>`
    )
    .join('');

  const ownerSubject =
    order.type === 'retail'
      ? `🛒 New Retail Order — Kalaland #${order.orderId}`
      : `🏢 New Wholesale Order — Kalaland #${order.orderId}`;

  const ownerBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a3a5c">New Order #${order.orderId}</h2>
      <p><strong>Type:</strong> ${order.type === 'retail' ? 'Retail' : 'Wholesale'}</p>
      <hr/>
      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${order.customer.name}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>
      <p><strong>Address:</strong> ${order.customer.address}</p>
      ${order.customer.businessName ? `<p><strong>Business:</strong> ${order.customer.businessName}</p>` : ''}
      ${order.customer.notes ? `<p><strong>Notes:</strong> ${order.customer.notes}</p>` : ''}
      <hr/>
      <h3>Order Items</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#1a3a5c;color:white">
            <th style="padding:8px;text-align:left">Product</th>
            <th style="padding:8px;text-align:center">Qty</th>
            <th style="padding:8px;text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size:1.2em;font-weight:bold;color:#1a3a5c">
        TOTAL: ${order.total.toLocaleString()} IRR
      </p>
    </div>
  `;

  const customerBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a3a5c">✅ Order Confirmed — Kalaland Appliances</h2>
      <p>Dear ${order.customer.name},</p>
      <p>Thank you for your order! We have received your request and will contact you shortly to confirm and arrange payment/delivery.</p>
      <p><strong>Order #:</strong> ${order.orderId}</p>
      <p><strong>Total:</strong> ${order.total.toLocaleString()} IRR</p>
      <p>If you have any questions, please call us directly.</p>
      <br/>
      <p style="color:#888;font-size:0.9em">Kalaland Household Appliances</p>
    </div>
  `;

  const fromSender = process.env.EMAIL_FROM || 'Kalaland Orders <onboarding@resend.dev>';

  await Promise.all([
    resend.emails.send({
      from: fromSender,
      to: RECIPIENT,
      subject: ownerSubject,
      html: ownerBody,
    }),
    ...(order.customer.email
      ? [
          resend.emails.send({
            from: fromSender,
            to: order.customer.email,
            subject: `Order Confirmed — Kalaland #${order.orderId}`,
            html: customerBody,
          }),
        ]
      : []),
  ]);
}
