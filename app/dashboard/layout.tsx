export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardSidebar, MobileDashboardNav } from '@/components/dashboard/sidebar';
import { Navbar } from '@/components/site/navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} />
        <MobileDashboardNav />
        <main className="flex-1 bg-background p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
