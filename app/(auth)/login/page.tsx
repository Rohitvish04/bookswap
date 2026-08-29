import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Log In' };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Log in to manage your books and exchanges.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <div className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot your password?</Link>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to BookSwap? <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
