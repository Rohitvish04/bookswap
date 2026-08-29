import type { Metadata } from 'next';
import { WishlistClient } from './wishlist-client';

export const metadata: Metadata = { title: 'Wishlist' };

export default function WishlistPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <p className="mt-1 text-muted-foreground">Books you're hoping to find. We'll notify you when a match is listed.</p>
      <div className="mt-6">
        <WishlistClient />
      </div>
    </div>
  );
}
