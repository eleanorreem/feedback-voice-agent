import Link from 'next/link';
import { AuthForm } from '@/components/app/auth-form';

export default function LoginPage() {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center px-4">
      <div className="flex flex-col items-center">
        <h1 className="text-foreground mb-2 text-2xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground mb-8 text-sm">Sign in to your reflective journal</p>

        <AuthForm mode="login" />

        <p className="text-muted-foreground mt-6 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
