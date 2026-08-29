'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { changePasswordSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/site/form-field';

type FormValues = z.infer<typeof changePasswordSchema>;

export function AdminPasswordForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(values: FormValues) {
    const res = await apiFetch('/api/auth/change-password', { body: values });
    if (res.ok) { toast.success('Password changed.'); reset(); }
    else toast.error(res.error);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Current Password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input id="currentPassword" type="password" {...register('currentPassword')} />
          </FormField>
          <FormField label="New Password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" {...register('password')} />
          </FormField>
          <FormField label="Confirm New Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
          </FormField>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Password'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
