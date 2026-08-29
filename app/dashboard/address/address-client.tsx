'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, MapPin } from 'lucide-react';
import type { z } from 'zod';
import { addressSchema, radiusSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { FormField } from '@/components/site/form-field';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';

type FormValues = z.infer<typeof addressSchema>;
type Address = FormValues & { id: string };

const RADIUS_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '0', label: 'Anywhere' },
];

function AddressForm({ initial, onSaved, onClose }: { initial?: Address; onSaved: () => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial ?? { label: 'Home', isDefault: false },
  });

  async function onSubmit(values: FormValues) {
    const res = initial
      ? await apiFetch(`/api/addresses/${initial.id}`, { method: 'PATCH', body: values })
      : await apiFetch('/api/addresses', { body: values });
    if (res.ok) { toast.success('Address saved.'); onSaved(); onClose(); }
    else toast.error(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Label" htmlFor="label" error={errors.label?.message}>
          <Input id="label" placeholder="Home, Office..." {...register('label')} />
        </FormField>
        <FormField label="Full Name" htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" {...register('fullName')} />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} className="sm:col-span-2">
          <Input id="phone" {...register('phone')} />
        </FormField>
        <FormField label="House / Building" htmlFor="addressLine" error={errors.addressLine?.message} className="sm:col-span-2">
          <Input id="addressLine" {...register('addressLine')} />
        </FormField>
        <FormField label="Area" htmlFor="area" error={errors.area?.message} className="sm:col-span-2">
          <Input id="area" {...register('area')} />
        </FormField>
        <FormField label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" {...register('city')} />
        </FormField>
        <FormField label="State" htmlFor="state" error={errors.state?.message}>
          <Input id="state" {...register('state')} />
        </FormField>
        <FormField label="Pincode" htmlFor="pincode" error={errors.pincode?.message} className="sm:col-span-2">
          <Input id="pincode" {...register('pincode')} />
        </FormField>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Saving...' : 'Save Address'}</Button>
    </form>
  );
}

export function AddressClient() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [radius, setRadius] = useState('25');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | undefined>(undefined);

  async function load() {
    const res = await apiFetch<Address[]>('/api/addresses');
    if (res.ok) setAddresses(res.data);
    const me = await apiFetch<{ searchRadiusKm: number }>('/api/users/me');
    if (me.ok) setRadius(String(me.data.searchRadiusKm));
  }

  useEffect(() => { load(); }, []);

  async function setDefault(id: string) {
    const res = await apiFetch(`/api/addresses/${id}/default`, { method: 'POST' });
    if (res.ok) { toast.success('Default address updated.'); load(); }
    else toast.error(res.error);
  }

  async function remove(id: string) {
    if (!confirm('Delete this address?')) return;
    const res = await apiFetch(`/api/addresses/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Address deleted.'); load(); }
    else toast.error(res.error);
  }

  async function updateRadius(v: string) {
    setRadius(v);
    const res = await apiFetch('/api/users/me/radius', { body: { searchRadiusKm: Number(v) } });
    if (res.ok) toast.success('Search radius updated.');
    else toast.error(res.error);
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="font-medium">Exchange search radius</p>
            <p className="text-sm text-muted-foreground">How far should we look for matching books?</p>
          </div>
          <Select value={radius} onValueChange={updateRadius}>
            <SelectTrigger className="w-40"><MapPin className="mr-1 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
            <SelectContent>{RADIUS_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Saved Addresses</h2>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(undefined); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(undefined)}><Plus className="h-4 w-4" /> Add Address</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Address' : 'Add Address'}</DialogTitle></DialogHeader>
            <AddressForm initial={editing} onSaved={load} onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {addresses === null ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses yet" description="Add an address so we can find exchanges near you." />
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.label}</p>
                    {a.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.addressLine}, {a.area}, {a.city}, {a.state} — {a.pincode}</p>
                </div>
                <div className="flex gap-2">
                  {!a.isDefault && <Button size="sm" variant="outline" onClick={() => setDefault(a.id)}><Star className="h-3.5 w-3.5" /> Set Default</Button>}
                  <Button size="sm" variant="outline" onClick={() => { setEditing(a); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
