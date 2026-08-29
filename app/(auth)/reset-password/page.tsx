'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { resetPasswordSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/site/form-field';

type FormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(values: FormValues) {
    const res = await apiFetch('/api/auth/reset-password', { body: { ...values, token } });
    if (res.ok) {
      toast.success('Password reset. Please log in.');
      router.push('/login');
    } else {
      toast.error(res.error);
    }
  }

  if (!token) {
    return <p className="text-sm text-destructive">This reset link is missing a token. Please request a new one from the forgot password page.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <FormField label="New Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" {...register('password')} />
      </FormField>
      <FormField label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
      </FormField>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
