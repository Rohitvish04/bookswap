'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { z } from 'zod';
import { registerSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/site/form-field';

type FormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: FormValues) {
    const res = await apiFetch('/api/auth/register', { body: values });
    if (res.ok) {
      toast.success('Account created! Check your email to verify your address.');
      router.push('/dashboard');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Full Name" htmlFor="fullName" error={errors.fullName?.message} className="col-span-2">
          <Input id="fullName" {...register('fullName')} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} className="col-span-2">
          <Input id="email" type="email" {...register('email')} />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} className="col-span-2">
          <Input id="phone" placeholder="9876543210" {...register('phone')} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" {...register('password')} />
        </FormField>
        <FormField label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
        </FormField>
        <FormField label="House / Building" htmlFor="addressLine" error={errors.addressLine?.message} className="col-span-2">
          <Input id="addressLine" {...register('addressLine')} />
        </FormField>
        <FormField label="Area" htmlFor="area" error={errors.area?.message} className="col-span-2">
          <Input id="area" {...register('area')} />
        </FormField>
        <FormField label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" {...register('city')} />
        </FormField>
        <FormField label="State" htmlFor="state" error={errors.state?.message}>
          <Input id="state" {...register('state')} />
        </FormField>
        <FormField label="Pincode" htmlFor="pincode" error={errors.pincode?.message} className="col-span-2">
          <Input id="pincode" {...register('pincode')} />
        </FormField>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
