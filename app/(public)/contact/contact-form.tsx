'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { contactSchema } from '@/lib/validation';
import type { z } from 'zod';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/site/form-field';

type FormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful }, reset } = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(values: FormValues) {
    const res = await apiFetch('/api/contact', { body: values });
    if (res.ok) {
      toast.success("Message sent! We'll get back to you soon.");
      reset();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" {...register('name')} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" {...register('email')} />
      </FormField>
      <FormField label="Subject" htmlFor="subject" error={errors.subject?.message}>
        <Input id="subject" {...register('subject')} />
      </FormField>
      <FormField label="Message" htmlFor="body" error={errors.body?.message}>
        <Textarea id="body" rows={5} {...register('body')} />
      </FormField>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
      {isSubmitSuccessful && <p className="text-center text-sm text-success">Thanks — we received your message.</p>}
    </form>
  );
}
