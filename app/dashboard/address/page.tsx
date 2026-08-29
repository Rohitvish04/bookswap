import type { Metadata } from 'next';
import { AddressClient } from './address-client';

export const metadata: Metadata = { title: 'Address & Location' };

export default function AddressPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Address & Location</h1>
      <p className="mt-1 text-muted-foreground">
        We use your address to calculate approximate distance to other users. Your exact address is never shown publicly.
      </p>
      <div className="mt-6">
        <AddressClient />
      </div>
    </div>
  );
}
