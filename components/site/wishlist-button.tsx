'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export function WishlistButton({ title, author, bookId, isAuthed }: { title: string; author: string; bookId: string; isAuthed: boolean }) {
  const [added, setAdded] = useState(false);

  if (!isAuthed) {
    return <Button variant="outline" asChild className="w-full"><Link href="/login"><Heart className="h-4 w-4" /> Log in to Wishlist</Link></Button>;
  }

  async function toggle() {
    const res = await apiFetch('/api/wishlist', { body: { title, author, bookId } });
    if (res.ok) { setAdded(true); toast.success('Added to wishlist.'); }
    else toast.error(res.error);
  }

  return (
    <Button variant="outline" className="w-full" onClick={toggle} disabled={added}>
      <Heart className={added ? 'h-4 w-4 fill-destructive text-destructive' : 'h-4 w-4'} /> {added ? 'On your wishlist' : 'Add to Wishlist'}
    </Button>
  );
}
