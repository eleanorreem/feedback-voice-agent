import Link from 'next/link';
import { AuthForm } from '@/components/app/auth-form';

export default function SignupPage() {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center px-4">
      <div className="flex flex-col items-center">
        <h1 className="text-foreground mb-2 text-2xl font-semibold">Create your account</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Start your reflective journaling practice
        </p>

        <AuthForm mode="signup" />

        <p className="text-muted-foreground mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
