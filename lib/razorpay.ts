import { createHmac } from 'node:crypto';

const BASE_URL = 'https://api.razorpay.com/v1';

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error('Razorpay credentials are not configured.');
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

/** Creates a Razorpay order server-side. Amount is in paise. */
export async function createRazorpayOrder(amount: number, receipt: string, notes?: Record<string, string>) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: 'INR', receipt, notes, payment_capture: 1 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Razorpay order creation failed: ${res.status} ${text}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Verifies the checkout signature. NEVER trust `razorpay_payment_id` presence alone. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay credentials are not configured.');
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return expected === signature;
}

/** Verifies an incoming webhook body against RAZORPAY_WEBHOOK_SECRET. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}
