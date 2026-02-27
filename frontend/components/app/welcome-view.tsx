'use client';

import { ReflectionLibrary } from '@/components/app/reflection-library';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useReflections } from '@/hooks/useReflections';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const { user, logout } = useAuth();
  const { reflections, loading, tagFilter, filterByTag } = useReflections();

  return (
    <div ref={ref} className="bg-background min-h-svh">
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-12">
        {/* Header section */}
        <section className="mb-10 flex flex-col items-center text-center">
          <h1 className="text-foreground mb-2 text-2xl font-semibold">Your reflective journal</h1>
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            A space for voice-guided reflection. Each session is a conversation — up to 10 minutes,
            3 questions — followed by a written summary you can review and keep.
          </p>

          <Button
            size="lg"
            onClick={onStartCall}
            className="mt-6 w-64 rounded-full font-mono text-xs font-bold tracking-wider uppercase"
          >
            {startButtonText}
          </Button>

          {user && (
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-foreground mt-4 text-xs underline underline-offset-4 transition-colors"
            >
              Sign out
            </button>
          )}
        </section>

        {/* Reflection library */}
        <section>
          <h2 className="text-foreground mb-4 text-lg font-medium">Past reflections</h2>
          <ReflectionLibrary
            reflections={reflections}
            loading={loading}
            tagFilter={tagFilter}
            onFilterByTag={filterByTag}
          />
        </section>
      </div>
    </div>
  );
};
