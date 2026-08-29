import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'FAQ', description: 'Answers to common questions about exchanging books on BookSwap.' };

const faqs = [
  { q: 'Is BookSwap free to use?', a: 'Creating an account, listing books, and browsing are completely free. We charge zero commission on books — a book never has a price on BookSwap. A small, transparent service fee applies only when an exchange is confirmed, and you always see the exact amount before you pay.' },
  { q: 'Do I pay for the book I receive?', a: 'No — the book itself is always free. You must offer one of your own books in return; the platform only charges a service fee to confirm the trade. Whatever books you exchange, no money changes hands between readers.' },
  { q: 'How is this different from buying second-hand books?', a: "Second-hand marketplaces make you price, negotiate, and pay for every book. BookSwap is a pure trade: your finished books are your currency. One book out, one book in — there's no haggling and no middlemen." },
  { q: 'Can I exchange textbooks and exam-prep books?', a: 'Absolutely — school and NCERT books, engineering and medical texts, and competitive-exam prep (JEE, NEET, UPSC) are among the most requested categories. List the edition and condition clearly and matches come fast around exam season.' },
  { q: 'How do I meet the other reader safely?', a: 'We recommend meeting in a public place — a café, metro station, library, or campus. Only your city and an approximate distance are ever shown publicly; your exact address stays private, and you choose what to share in chat when arranging the handover.' },
  { q: 'Do I have to ship books?', a: 'Usually not — BookSwap is local-first. The distance filter (5, 10, 25, 50 km) helps you find readers close enough to meet, so most exchanges cost nothing to hand over. If you match with someone farther away, you can privately agree on delivery instead.' },
  { q: "What if the other person doesn't want any of my books?", a: 'You can only request an exchange if you have something to offer, and they can send a counter-offer asking for a different book from your shelf. Both sides must agree before anything is final.' },
  { q: 'Can I cancel an exchange request?', a: 'Yes, you can cancel a pending request any time before it is confirmed. Both books are released back to Available status immediately.' },
  { q: 'What happens if a payment fails?', a: 'You can retry the payment. The exchange stays in Payment Pending state and the books remain reserved until the expiry window passes. Payments are verified on our servers via Razorpay — never from the browser.' },
  { q: 'How does swapping help the environment?', a: 'Every exchanged book is one fewer new copy printed. Reusing a book is like giving a tree a second life — your finished shelf becomes someone else’s next read instead of paper waste.' },
  { q: 'Can I message a user before requesting an exchange?', a: 'Messaging opens once an exchange request exists between two users, to keep conversations relevant and prevent spam.' },
  { q: 'How do I report a problem?', a: 'Every exchange has a report option. Our admin team reviews all reports and can resolve disputes, refund-eligible cases included.' },
];

export default function FaqPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
      <div className="mt-10 space-y-4">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-lg border border-border bg-card p-4" open>
            <summary className="cursor-pointer list-none font-medium marker:content-none">{f.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
