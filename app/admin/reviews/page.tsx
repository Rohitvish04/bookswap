import type { Metadata } from 'next';
import { ReviewsAdminClient } from './reviews-admin-client';

export const metadata: Metadata = { title: 'Reviews' };

export default function AdminReviewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Reviews</h1>
      <p className="mt-1 text-muted-foreground">All ratings and reviews submitted after completed exchanges.</p>
      <div className="mt-6">
        <ReviewsAdminClient />
      </div>
    </div>
  );
}
