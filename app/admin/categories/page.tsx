import type { Metadata } from 'next';
import { CategoriesAdminClient } from './categories-admin-client';

export const metadata: Metadata = { title: 'Manage Categories' };

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-muted-foreground">Manage the book categories shown across the platform.</p>
      <div className="mt-6">
        <CategoriesAdminClient />
      </div>
    </div>
  );
}
