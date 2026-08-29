'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

function VerifyEmailInner() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Missing verification token.');
      return;
    }
    apiFetch('/api/auth/verify-email', { body: { token } }).then((res) => {
      if (res.ok) setState('ok');
      else {
        setState('error');
        setMessage(res.error);
      }
    });
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (state === 'ok') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h1 className="text-xl font-semibold">Email verified!</h1>
        <p className="text-sm text-muted-foreground">Your account is now fully verified.</p>
        <Button asChild className="mt-2"><Link href="/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <XCircle className="h-10 w-10 text-destructive" />
      <h1 className="text-xl font-semibold">Verification failed</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline" className="mt-2"><Link href="/dashboard/settings">Go to Settings</Link></Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
