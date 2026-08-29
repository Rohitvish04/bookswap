import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN')}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. What we collect</h2>
          <p className="mt-2 text-muted-foreground">Name, email, phone number, password (hashed, never stored in plain text), address details for location matching, book listings, messages, and payment metadata (never full card details — those are handled entirely by Razorpay).</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. How we use your location</h2>
          <p className="mt-2 text-muted-foreground">Your address is converted to an approximate latitude/longitude used only to compute distance to other users and to filter search results. Your exact address is never displayed to other users — only city, state, and a rounded distance figure such as "2.4 km away".</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Who can see what</h2>
          <p className="mt-2 text-muted-foreground">Other users can see your first name, profile photo, city/state, rating, and listed books. Your email, phone number, and exact address are private and only shared with an exchange partner if you choose to share them for delivery.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Payments</h2>
          <p className="mt-2 text-muted-foreground">Payments are processed by Razorpay. We store only order IDs, payment IDs, amount, and status for our records — never your card or bank details.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Data retention & deletion</h2>
          <p className="mt-2 text-muted-foreground">You can delete your account from Settings. This deactivates your listings and anonymizes personal data, subject to records we must retain for completed payments.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">6. Contact</h2>
          <p className="mt-2 text-muted-foreground">Questions about this policy can be sent via our Contact page.</p>
        </section>
      </div>
    </div>
  );
}
