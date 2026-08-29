export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Navbar } from '@/components/site/navbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} />
        <main className="flex-1 bg-background p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
