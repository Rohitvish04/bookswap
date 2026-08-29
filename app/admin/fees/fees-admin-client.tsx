'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { feeSettingsSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/site/form-field';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/utils';

type FormValues = z.infer<typeof feeSettingsSchema>;

export function FeesAdminClient() {
  const [loaded, setLoaded] = useState(false);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(feeSettingsSchema),
    defaultValues: { feeType: 'FIXED', feeFixedPaise: 4900, feePercent: 5, feeMinPaise: 1900, exchangeExpiryDays: 7 },
  });

  useEffect(() => {
    apiFetch<FormValues>('/api/admin/fees').then((res) => {
      if (res.ok) reset(res.data);
      setLoaded(true);
    });
  }, [reset]);

  async function onSubmit(values: FormValues) {
    const res = await apiFetch('/api/admin/fees', { method: 'PUT', body: values });
    if (res.ok) toast.success('Fee settings updated.');
    else toast.error(res.error);
  }

  const feeType = watch('feeType');

  if (!loaded) return <Skeleton className="h-80 w-full" />;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Fee Type" htmlFor="feeType">
            <Select value={feeType} onValueChange={(v) => setValue('feeType', v as FormValues['feeType'])}>
              <SelectTrigger id="feeType"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed Amount</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {feeType === 'FIXED' ? (
            <FormField label="Fixed Fee (in paise, ₹1 = 100 paise)" htmlFor="feeFixedPaise" error={errors.feeFixedPaise?.message}>
              <Input id="feeFixedPaise" type="number" {...register('feeFixedPaise', { valueAsNumber: true })} />
              <p className="mt-1 text-xs text-muted-foreground">= {formatINR(watch('feeFixedPaise') || 0)}</p>
            </FormField>
          ) : (
            <>
              <FormField label="Percentage Fee (%)" htmlFor="feePercent" error={errors.feePercent?.message}>
                <Input id="feePercent" type="number" step="0.1" {...register('feePercent', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Minimum Fee (in paise)" htmlFor="feeMinPaise" error={errors.feeMinPaise?.message}>
                <Input id="feeMinPaise" type="number" {...register('feeMinPaise', { valueAsNumber: true })} />
                <p className="mt-1 text-xs text-muted-foreground">= {formatINR(watch('feeMinPaise') || 0)}</p>
              </FormField>
            </>
          )}

          <FormField label="Exchange Expiry (days)" htmlFor="exchangeExpiryDays" error={errors.exchangeExpiryDays?.message}>
            <Input id="exchangeExpiryDays" type="number" {...register('exchangeExpiryDays', { valueAsNumber: true })} />
            <p className="mt-1 text-xs text-muted-foreground">Pending exchange requests auto-expire after this many days.</p>
          </FormField>

          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Fee Settings'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
