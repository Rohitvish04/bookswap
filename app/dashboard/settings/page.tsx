import type { Metadata } from 'next';
import { SettingsClient } from './settings-client';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage your password and account.</p>
      <div className="mt-6">
        <SettingsClient />
      </div>
    </div>
  );
}
