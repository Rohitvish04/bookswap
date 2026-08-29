'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

type Category = { id: string; name: string; isActive: boolean; _count: { books: number } };

export function CategoriesAdminClient() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    const res = await apiFetch<Category[]>('/api/admin/categories');
    if (res.ok) setCategories(res.data);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    setAdding(true);
    const res = await apiFetch('/api/admin/categories', { body: { name, isActive: true } });
    setAdding(false);
    if (res.ok) { setName(''); toast.success('Category added.'); load(); }
    else toast.error(res.error);
  }

  async function toggle(cat: Category) {
    const res = await apiFetch(`/api/admin/categories/${cat.id}`, { method: 'PATCH', body: { name: cat.name, isActive: !cat.isActive } });
    if (res.ok) { load(); } else toast.error(res.error);
  }

  async function remove(id: string) {
    if (!confirm('Delete this category?')) return;
    const res = await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Category removed or disabled.'); load(); }
    else toast.error(res.error);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex gap-3 pt-6">
          <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={add} disabled={adding}><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      {categories === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c._count.books} book{c._count.books === 1 ? '' : 's'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={c.isActive} onCheckedChange={() => toggle(c)} />
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
