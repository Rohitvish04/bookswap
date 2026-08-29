'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Star, Upload, Loader2, MailWarning } from 'lucide-react';
import type { z } from 'zod';
import { profileSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/site/form-field';
import { initials, formatDate } from '@/lib/utils';

type FormValues = z.infer<typeof profileSchema>;
type Me = FormValues & { id: string; email: string; createdAt: string; emailVerifiedAt: string | null; ratingAvg: number; ratingCount: number };

export function ProfileClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    apiFetch<Me>('/api/users/me').then((res) => {
      if (res.ok) {
        setMe(res.data);
        setAvatarUrl(res.data.avatarUrl || '');
        reset({ fullName: res.data.fullName, phone: res.data.phone ?? '', bio: res.data.bio, avatarUrl: res.data.avatarUrl });
      }
    });
  }, [reset]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const csrfMatch = document.cookie.match(/(?:^|; )bookswap_csrf=([^;]+)/);
    const res = await fetch('/api/uploads', { method: 'POST', body: form, headers: { 'x-csrf-token': csrfMatch ? decodeURIComponent(csrfMatch[1]) : '' } });
    const json = await res.json();
    setUploading(false);
    if (json.ok) { setAvatarUrl(json.data.url); toast.success('Photo uploaded.'); }
    else toast.error(json.error);
  }

  async function onSubmit(values: FormValues) {
    const res = await apiFetch('/api/users/me', { method: 'PATCH', body: { ...values, avatarUrl } });
    if (res.ok) toast.success('Profile updated.');
    else toast.error(res.error);
  }

  async function resendVerification() {
    setResending(true);
    const res = await apiFetch('/api/auth/resend-verification', { method: 'POST' });
    setResending(false);
    if (res.ok) toast.success('Verification email sent.');
    else toast.error(res.error);
  }

  if (!me) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {!me.emailVerifiedAt && (
        <Card className="border-secondary/40 bg-secondary/10">
          <CardContent className="flex items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm"><MailWarning className="h-4 w-4" /> Your email isn't verified yet.</div>
            <Button size="sm" variant="outline" onClick={resendVerification} disabled={resending}>{resending ? 'Sending...' : 'Resend Email'}</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-lg">{initials(me.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Change photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-secondary text-secondary" /> {me.ratingAvg.toFixed(1)} ({me.ratingCount} reviews) · Member since {formatDate(me.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" {...register('fullName')} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" {...register('phone')} />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input id="email" value={me.email} disabled />
          </FormField>
        </div>
        <FormField label="Bio" htmlFor="bio" error={errors.bio?.message}>
          <Textarea id="bio" rows={3} {...register('bio')} placeholder="Tell other readers a bit about yourself..." />
        </FormField>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
      </form>
    </div>
  );
}
