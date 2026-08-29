import type { Metadata } from 'next';
import { ProfileClient } from './profile-client';

export const metadata: Metadata = { title: 'Profile' };

export default function ProfilePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-muted-foreground">This is what other readers see about you.</p>
      <div className="mt-6">
        <ProfileClient />
      </div>
    </div>
  );
}
