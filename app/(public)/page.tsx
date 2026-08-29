export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  MapPin, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroSection } from '@/components/home/hero-section';
import { StatsSection } from '@/components/home/stats-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { FeaturedBooksSection } from '@/components/home/featured-books-section';
import { BenefitsSection } from '@/components/home/benefits-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { FaqSection } from '@/components/home/faq-section';
import { CtaSection } from '@/components/home/cta-section';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/utils';
import { getFeeSettings, computeFee } from '@/lib/settings';

async function getHomeData() {
  const [featured, feeSettings] = await Promise.all([
    prisma.book.findMany({
      where: { status: 'AVAILABLE', available: true, moderation: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { owner: { include: { addresses: { where: { isDefault: true }, take: 1 } } }, category: true },
    }),
    getFeeSettings(),
  ]);
  return { featured, fee: computeFee(feeSettings) };
}

export default async function HomePage() {
  const { featured, fee } = await getHomeData();

  return (
    <div>
      <HeroSection feeLabel={formatINR(fee.amount)} />

      <StatsSection />

      <HowItWorksSection />

      <FeaturedBooksSection
        books={featured.map((b) => ({
          id: b.id,
          slug: b.slug,
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
          condition: b.condition,
          city: b.owner.addresses[0]?.city ?? null,
        }))}
      />

      {/* Nearby concept */}
      <section className="container py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-4"><MapPin className="mr-1 h-3.5 w-3.5" /> Location-aware</Badge>
            <h2 className="text-3xl font-bold">Find Exchanges Right Near You</h2>
            <p className="mt-4 text-muted-foreground">
              BookSwap converts your address into an approximate location so you can discover readers 5, 10, 25 or 50 km away —
              or anywhere in the country. We never publish your exact address; other users only see a friendly distance like
              "2.4 km away".
            </p>
            <ul className="mt-6 space-y-3">
              {['Set your preferred exchange radius', 'See distance on every book listing', 'Meet nearby or arrange delivery'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /> {t}</li>
              ))}
            </ul>
          </div>
          <Card className="p-8">
            <div className="space-y-4">
              {[
                { title: 'Atomic Habits', dist: 'Under 1 km away', match: 98 },
                { title: 'The Alchemist', dist: '2.4 km away', match: 91 },
                { title: 'Rich Dad Poor Dad', dist: '6 km away', match: 84 },
              ].map((r) => (
                <div key={r.title} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.dist}</div>
                  </div>
                  <Badge variant="success">{r.match}% Match</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <BenefitsSection />

      <TestimonialsSection />

      <FaqSection />

      <CtaSection />
    </div>
  );
}
