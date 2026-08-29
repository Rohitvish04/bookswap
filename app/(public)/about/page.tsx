import type { Metadata } from 'next';
import { Users, BookOpen, HeartHandshake, Leaf } from 'lucide-react';

export const metadata: Metadata = { title: 'About Us', description: "Learn about BookSwap's mission to keep books moving between readers." };

const values = [
  { icon: BookOpen, title: 'Books deserve a second life', desc: 'Every book you\'ve finished can spark joy for someone else nearby.' },
  { icon: Users, title: 'Community over commerce', desc: 'We built a trade economy, not a marketplace — zero commission, no price tags, no middlemen.' },
  { icon: HeartHandshake, title: 'Trust and safety first', desc: 'Verified accounts, ratings, private addresses, and public-place meetups keep every exchange safe.' },
  { icon: Leaf, title: 'Sustainable reading', desc: 'Reusing a book is like giving a tree a second life. Save books, save paper, save trees.' },
];

export default function AboutPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">About BookSwap</h1>
        <p className="mt-4 text-muted-foreground">
          BookSwap started with a simple frustration: shelves full of books we'd already read, and a wishlist full of
          books we hadn't. Instead of buying more, we built a platform where readers trade directly with each other —
          a book for a book, plus a small fee to keep the lights on.
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2">
        {values.map((v) => (
          <div key={v.title} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <v.icon className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-semibold">{v.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
