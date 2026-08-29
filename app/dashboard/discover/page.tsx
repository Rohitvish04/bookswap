import type { Metadata } from 'next';
import { DiscoverClient } from './discover-client';

export const metadata: Metadata = { title: 'Discover Books' };

export default function DiscoverPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Discover Books</h1>
      <p className="mt-1 text-muted-foreground">Smart matches based on what you own and what you want, near you.</p>
      <div className="mt-6">
        <DiscoverClient />
      </div>
    </div>
  );
}
