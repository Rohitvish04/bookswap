import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms & Conditions' };

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-16 prose-sm">
      <h1 className="text-4xl font-bold">Terms & Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN')}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Nature of the platform</h2>
          <p className="mt-2 text-muted-foreground">BookSwap facilitates direct book-for-book exchanges between users. BookSwap does not buy, sell, or take ownership of any book at any point. A service fee is charged only to confirm a completed exchange arrangement, not as payment for the book itself.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. Eligibility</h2>
          <p className="mt-2 text-muted-foreground">You must be at least 18 years old and provide accurate registration information, including a valid address for location-based matching.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. User responsibilities</h2>
          <p className="mt-2 text-muted-foreground">You are solely responsible for the accuracy of your book listings, the condition of books you offer, and honoring accepted exchanges. Misrepresenting a book's condition may result in account suspension.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Fees and payments</h2>
          <p className="mt-2 text-muted-foreground">Service fees are set by BookSwap administrators and may be fixed or percentage-based. All payments are processed through Razorpay and verified server-side before an exchange is confirmed. Fees are non-refundable once an exchange is completed, except where a dispute is resolved in your favor.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Prohibited conduct</h2>
          <p className="mt-2 text-muted-foreground">You may not use BookSwap to sell books for cash, harass other users, list copyrighted material you do not own, or attempt to circumvent the exchange or payment system.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">6. Disputes</h2>
          <p className="mt-2 text-muted-foreground">If an exchange goes wrong, either party may file a report. BookSwap administrators will review evidence from both sides and may suspend accounts found to be acting in bad faith.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">7. Limitation of liability</h2>
          <p className="mt-2 text-muted-foreground">BookSwap is a platform connecting readers and is not liable for the condition of exchanged books, missed meetups, or delivery issues arranged privately between users.</p>
        </section>
      </div>
    </div>
  );
}
