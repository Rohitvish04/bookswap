import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/site/navbar';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <Navbar user={user} />;
}
