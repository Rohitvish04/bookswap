'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import type { z } from 'zod';
import { bookSchema } from '@/lib/validation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/site/form-field';
import { BookCover } from '@/components/site/book-cover';

type FormValues = z.infer<typeof bookSchema>;
type Category = { id: string; name: string };

const CONDITIONS = [
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'VERY_GOOD', label: 'Very Good' },
  { value: 'GOOD', label: 'Good' },
  { value: 'ACCEPTABLE', label: 'Acceptable' },
] as const;

export function BookForm({
  bookId,
  defaultValues,
}: {
  bookId?: string;
  defaultValues?: Partial<FormValues> & { coverUrl?: string };
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverUrl, setCoverUrl] = useState(defaultValues?.coverUrl ?? '');
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      language: 'English',
      condition: 'GOOD',
      available: true,
      wantedBooks: [{ title: '', author: '' }],
      ...defaultValues,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'wantedBooks' });

  useEffect(() => {
    apiFetch<Category[]>('/api/categories').then((res) => { if (res.ok) setCategories(res.data); });
  }, []);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, or WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const csrfMatch = document.cookie.match(/(?:^|; )bookswap_csrf=([^;]+)/);
    const res = await fetch('/api/uploads', { method: 'POST', body: form, headers: { 'x-csrf-token': csrfMatch ? decodeURIComponent(csrfMatch[1]) : '' } });
    const json = await res.json();
    setUploading(false);
    if (json.ok) {
      setCoverUrl(json.data.url);
      setValue('coverUrl', json.data.url);
      toast.success('Cover uploaded.');
    } else {
      toast.error(json.error ?? 'Upload failed.');
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = { ...values, coverUrl, wantedBooks: values.wantedBooks.filter((w) => w.title.trim()) };
    const res = bookId
      ? await apiFetch(`/api/books/${bookId}`, { method: 'PATCH', body: payload })
      : await apiFetch('/api/books', { body: payload });

    if (res.ok) {
      toast.success(bookId ? 'Book updated!' : 'Book listed!');
      router.push('/dashboard/books');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <div>
        <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-muted">
          <BookCover src={coverUrl} title={watch('title') || 'Book cover'} />
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:bg-muted">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading...' : 'Upload cover'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} disabled={uploading} />
        </label>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Book Title" htmlFor="title" error={errors.title?.message} className="sm:col-span-2">
            <Input id="title" {...register('title')} />
          </FormField>
          <FormField label="Author" htmlFor="author" error={errors.author?.message}>
            <Input id="author" {...register('author')} />
          </FormField>
          <FormField label="ISBN (optional)" htmlFor="isbn" error={errors.isbn?.message}>
            <Input id="isbn" {...register('isbn')} />
          </FormField>
          <FormField label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
            <Select value={watch('categoryId') || undefined} onValueChange={(v) => setValue('categoryId', v)}>
              <SelectTrigger id="categoryId"><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Language" htmlFor="language" error={errors.language?.message}>
            <Input id="language" {...register('language')} />
          </FormField>
          <FormField label="Edition (optional)" htmlFor="edition" error={errors.edition?.message}>
            <Input id="edition" {...register('edition')} />
          </FormField>
          <FormField label="Publication Year (optional)" htmlFor="publishYear" error={errors.publishYear?.message}>
            <Input id="publishYear" type="number" {...register('publishYear')} />
          </FormField>
          <FormField label="Condition" htmlFor="condition" error={errors.condition?.message}>
            <Select value={watch('condition')} onValueChange={(v) => setValue('condition', v as FormValues['condition'])}>
              <SelectTrigger id="condition"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Description (optional)" htmlFor="description" error={errors.description?.message}>
          <Textarea id="description" rows={4} {...register('description')} />
        </FormField>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-medium">Available for Exchange</p>
            <p className="text-xs text-muted-foreground">Turn off to keep this listing private for now.</p>
          </div>
          <Switch checked={watch('available')} onCheckedChange={(v) => setValue('available', v)} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Books I Want in Exchange</label>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ title: '', author: '' })}>
              <Plus className="h-3.5 w-3.5" /> Add title
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="Wanted book title" {...register(`wantedBooks.${i}.title`)} />
                <Input placeholder="Author (optional)" {...register(`wantedBooks.${i}.author`)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {errors.wantedBooks?.message && <p className="mt-1 text-xs text-destructive">{errors.wantedBooks.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting || uploading} size="lg">
          {isSubmitting ? 'Saving...' : bookId ? 'Save Changes' : 'List Book'}
        </Button>
      </div>
    </form>
  );
}
