import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "Tawi Shop <orders@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type OrderItem = {
  product: { name: string; images?: string[] };
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
};

type OrderConfirmationParams = {
  to: string;
  orderNumber: string;
  customerName?: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod?: string | null;
};

export async function sendOrderConfirmation(params: OrderConfirmationParams): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set. Order confirmation email skipped.");
    return false;
  }

  try {
    const {
      to,
      orderNumber,
      customerName,
      items,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      paymentMethod,
    } = params;

    const itemsHtml = items
      .map(
        (i) =>
          `<tr><td>${i.product.name}${i.size ? ` (${i.size})` : ""}${i.color ? ` / ${i.color}` : ""}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td><td>$${(i.quantity * i.price).toFixed(2)}</td></tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmation</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #dc2626;">Thank you for your order!</h1>
  <p>Hi ${customerName || "Customer"},</p>
  <p>Your order <strong>#${orderNumber}</strong> has been received and payment confirmed.</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="text-align: left; padding: 12px;">Item</th>
        <th style="text-align: center; padding: 12px;">Qty</th>
        <th style="text-align: right; padding: 12px;">Price</th>
        <th style="text-align: right; padding: 12px;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  
  <table style="width: 100%; margin-top: 16px;">
    <tr><td style="padding: 4px;">Subtotal</td><td style="text-align: right;">$${subtotal.toFixed(2)}</td></tr>
    ${discount > 0 ? `<tr><td style="padding: 4px;">Discount</td><td style="text-align: right; color: green;">-$${discount.toFixed(2)}</td></tr>` : ""}
    <tr><td style="padding: 4px;">Tax</td><td style="text-align: right;">$${tax.toFixed(2)}</td></tr>
    <tr><td style="padding: 4px;">Shipping</td><td style="text-align: right;">$${shipping.toFixed(2)}</td></tr>
    <tr style="font-weight: bold; font-size: 1.1em;"><td style="padding: 12px 4px;">Total</td><td style="text-align: right; padding: 12px 0;">$${total.toFixed(2)}</td></tr>
  </table>
  
  <p style="margin-top: 24px; color: #666;">Payment method: ${paymentMethod || "M-Pesa"}</p>
  <p><a href="${SITE_URL}/order/${orderNumber}" style="color: #dc2626; font-weight: 600;">View order status →</a></p>
  <p style="margin-top: 32px; color: #888; font-size: 14px;">— Tawi Shop</p>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Order Confirmed - #${orderNumber}`,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Send order confirmation error:", err);
    return false;
  }
}
