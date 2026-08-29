'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { z } from 'zod';
import { loginSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/site/form-field';

type FormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: FormValues) {
    const res = await apiFetch<{ role: 'USER' | 'ADMIN' }>('/api/auth/login', { body: values });
    if (res.ok) {
      toast.success('Welcome back!');
      router.push(res.data.role === 'ADMIN' ? '/admin' : '/dashboard');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" {...register('email')} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" {...register('password')} />
      </FormField>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
