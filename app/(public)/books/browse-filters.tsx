'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CONDITIONS = ['LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Kannada'];

export function BrowseFilters({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');

  function update(key: string, value: string | undefined) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`/books?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:flex-wrap md:items-center">
      <form
        onSubmit={(e) => { e.preventDefault(); update('q', q || undefined); }}
        className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-input px-3"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, author, ISBN..."
          className="w-full bg-transparent py-2 text-sm outline-none"
        />
      </form>

      <Select value={sp.get('category') ?? undefined} onValueChange={(v) => update('category', v)}>
        <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
      </Select>

      <Select value={sp.get('condition') ?? undefined} onValueChange={(v) => update('condition', v)}>
        <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Condition" /></SelectTrigger>
        <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
      </Select>

      <Select value={sp.get('language') ?? undefined} onValueChange={(v) => update('language', v)}>
        <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Language" /></SelectTrigger>
        <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
      </Select>

      <Input
        placeholder="City"
        defaultValue={sp.get('city') ?? ''}
        onBlur={(e) => update('city', e.target.value || undefined)}
        className="w-full md:w-32"
      />

      <Select value={sp.get('sort') ?? 'recent'} onValueChange={(v) => update('sort', v)}>
        <SelectTrigger className="w-full md:w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recently Added</SelectItem>
          <SelectItem value="popular">Popular</SelectItem>
        </SelectContent>
      </Select>

      {sp.toString() && (
        <Button variant="ghost" size="sm" onClick={() => router.push('/books')}>Clear filters</Button>
      )}
    </div>
  );
}
