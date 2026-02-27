'use client';

import { useState } from 'react';
import type { Reflection } from '@/hooks/useReflections';

interface ReflectionCardProps {
  reflection: Reflection;
}

export function ReflectionCard({ reflection }: ReflectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(reflection.date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const preview =
    reflection.summary_text?.slice(0, 120) + (reflection.summary_text?.length > 120 ? '...' : '');

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="border-border bg-card hover:bg-accent/5 w-full cursor-pointer rounded-lg border p-4 text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">{date}</span>
            {reflection.mood && (
              <span className="text-muted-foreground text-xs italic">{reflection.mood}</span>
            )}
          </div>
          {!expanded && <p className="text-muted-foreground text-sm leading-relaxed">{preview}</p>}
        </div>
      </div>

      {/* Tags */}
      {reflection.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {reflection.tags.map((tag) => (
            <span key={tag} className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {reflection.summary_text && (
            <div>
              <h4 className="text-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                What you shared
              </h4>
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {reflection.summary_text}
              </p>
            </div>
          )}

          {reflection.themes.length > 0 && (
            <div>
              <h4 className="text-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                Themes
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {reflection.themes.map((theme) => (
                  <span
                    key={theme}
                    className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {reflection.actions && (
            <div>
              <h4 className="text-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                Actions
              </h4>
              <p className="text-foreground text-sm leading-relaxed">{reflection.actions}</p>
            </div>
          )}

          {reflection.mirror_reflection && (
            <div>
              <h4 className="text-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                Mirror reflection
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                {reflection.mirror_reflection}
              </p>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
