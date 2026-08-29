import type { Metadata } from 'next';
import Link from 'next/link';
import { BookMarked, Search, HandCoins, MessagesSquare, ShieldCheck, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'How It Works', description: 'Step by step guide to exchanging books on BookSwap.' };

const detailedSteps = [
  {
    icon: BookMarked,
    title: '1. List your books',
    body: 'Add the books you own with condition, category, and the titles you want in return. You can list as many books as you like.',
  },
  {
    icon: Search,
    title: '2. Discover matches',
    body: 'Our matching engine looks for direct matches (you want their book, they want yours), one-sided matches, and multi-book combinations — then ranks them by score, distance, and condition.',
  },
  {
    icon: Repeat,
    title: '3. Request or counter-offer',
    body: 'Send an exchange request offering one of your books. The other user can accept, reject, or propose a counter-offer with a different book.',
  },
  {
    icon: HandCoins,
    title: '4. Pay the service fee',
    body: 'Once accepted, pay the small platform fee via Razorpay (configured by admins as fixed or percentage). Payments are verified server-side — never trusted from the browser.',
  },
  {
    icon: MessagesSquare,
    title: '5. Coordinate the handover',
    body: 'Message each other, choose to meet nearby or arrange delivery, and mark the exchange completed once books change hands.',
  },
  {
    icon: ShieldCheck,
    title: '6. Rate each other',
    body: 'After completion, leave a rating and review — this builds trust for the whole community.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">How BookSwap Works</h1>
        <p className="mt-4 text-muted-foreground">A transparent, step-by-step exchange process designed to be fair for both sides.</p>
      </div>

      <div className="mx-auto mt-14 max-w-3xl space-y-6">
        {detailedSteps.map((s) => (
          <Card key={s.title}>
            <CardContent className="flex gap-4 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Button size="lg" asChild><Link href="/register">Get Started Now</Link></Button>
      </div>
    </div>
  );
}
