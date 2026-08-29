import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Join BookSwap and start exchanging books with readers near you.</p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
