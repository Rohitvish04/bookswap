'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HandCoins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { formatINR } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayPayButton({ exchangeId, amount, userName, userEmail }: { exchangeId: string; amount: number; userName: string; userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    const orderRes = await apiFetch<{ orderId: string; amount: number; currency: string; keyId: string }>('/api/payments/create-order', {
      body: { exchangeId },
    });
    if (!orderRes.ok) {
      toast.error(orderRes.error);
      setLoading(false);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Could not load Razorpay checkout. Check your connection and try again.');
      setLoading(false);
      return;
    }

    const { orderId, amount: orderAmount, currency, keyId } = orderRes.data;
    const rzp = new window.Razorpay({
      key: keyId,
      amount: orderAmount,
      currency,
      order_id: orderId,
      name: 'BookSwap',
      description: 'Exchange service fee',
      prefill: { name: userName, email: userEmail },
      theme: { color: '#5b4fe5' },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verifyRes = await apiFetch('/api/payments/verify', { body: response });
        if (verifyRes.ok) {
          toast.success('Payment successful! Exchange confirmed.');
          router.refresh();
        } else {
          toast.error(verifyRes.error);
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    });
    rzp.open();
    setLoading(false);
  }

  return (
    <Button onClick={pay} disabled={loading} size="lg">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandCoins className="h-4 w-4" />}
      Pay {formatINR(amount)} Service Fee
    </Button>
  );
}
