import type { Metadata } from 'next';
import { ContactForm } from './contact-form';

export const metadata: Metadata = { title: 'Contact Us', description: 'Get in touch with the BookSwap team.' };

export default function ContactPage() {
  return (
    <div className="container max-w-xl py-16">
      <h1 className="text-4xl font-bold">Contact Us</h1>
      <p className="mt-3 text-muted-foreground">Have a question, feedback, or found a bug? Send us a message and we'll get back to you.</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
