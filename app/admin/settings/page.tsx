import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { AdminPasswordForm } from './admin-password-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Admin Settings' };

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your admin account.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{admin.email}</span>. Fee configuration lives under{' '}
          <a href="/admin/fees" className="text-primary hover:underline">Fees</a>, and categories under{' '}
          <a href="/admin/categories" className="text-primary hover:underline">Categories</a>.
        </CardContent>
      </Card>

      <AdminPasswordForm />
    </div>
  );
}
