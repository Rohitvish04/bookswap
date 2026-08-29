'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import type { z } from 'zod';
import { forgotPasswordSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/site/form-field';

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: FormValues) {
    const res = await apiFetch('/api/auth/forgot-password', { body: values });
    if (res.ok) toast.success("If that email exists, we've sent a reset link.");
    else toast.error(res.error);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} />
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
        {isSubmitSuccessful && <p className="text-center text-sm text-success">Check your inbox for the reset link.</p>}
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
