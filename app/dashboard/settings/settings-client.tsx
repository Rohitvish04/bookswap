'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { z } from 'zod';
import { changePasswordSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { FormField } from '@/components/site/form-field';

type PasswordForm = z.infer<typeof changePasswordSchema>;

export function SettingsClient() {
  const router = useRouter();
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(values: PasswordForm) {
    const res = await apiFetch('/api/auth/change-password', { body: values });
    if (res.ok) { toast.success('Password changed.'); reset(); }
    else toast.error(res.error);
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await apiFetch('/api/users/me/delete', { body: { password: deletePassword } });
    setDeleting(false);
    if (res.ok) {
      toast.success('Account deleted.');
      router.push('/');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
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

      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">Deleting your account deactivates your listings and anonymizes your personal data. This cannot be undone.</p>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild><Button variant="destructive">Delete Account</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>Enter your password to confirm. You must resolve any active exchanges first.</DialogDescription>
              </DialogHeader>
              <Input type="password" placeholder="Password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={deleteAccount} disabled={deleting || !deletePassword}>{deleting ? 'Deleting...' : 'Delete My Account'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
