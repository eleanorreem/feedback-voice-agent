'use client';

import type { Reflection } from '@/hooks/useReflections';
import { getTagStyle } from '@/lib/tags';

interface ReflectionPageProps {
  reflection: Reflection;
}

export function DiaryLeftPage({ reflection }: ReflectionPageProps) {
  const date = new Date(reflection.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="diary-lines flex h-full flex-col">
      <header className="mb-4">
        <h2 className="text-foreground text-lg font-semibold">{date}</h2>
        {reflection.mood && (
          <p className="text-muted-foreground mt-0.5 text-sm italic">{reflection.mood}</p>
        )}
      </header>

      {/* Tags */}
      {reflection.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {reflection.tags.map((tag) => (
            <span
              key={tag}
              style={getTagStyle(tag)}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* What you shared */}
      {reflection.summary_text && (
        <div className="flex-1">
          <h3 className="text-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
            What you shared
          </h3>
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {reflection.summary_text}
          </p>
        </div>
      )}
    </div>
  );
}

export function DiaryRightPage({ reflection }: ReflectionPageProps) {
  const hasContent =
    reflection.themes.length > 0 || reflection.actions || reflection.mirror_reflection;

  if (!hasContent) return null;

  return (
    <div className="diary-lines flex h-full flex-col space-y-4">
      {/* Themes */}
      {reflection.themes.length > 0 && (
        <div>
          <h3 className="text-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
            Themes
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {reflection.themes.map((theme) => (
              <span
                key={theme}
                className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {reflection.actions && (
        <div>
          <h3 className="text-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
            Actions
          </h3>
          <p className="text-foreground text-sm leading-relaxed">{reflection.actions}</p>
        </div>
      )}

      {/* Mirror reflection */}
      {reflection.mirror_reflection && (
        <div>
          <h3 className="text-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
            Mirror reflection
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed italic">
            {reflection.mirror_reflection}
          </p>
        </div>
      )}
    </div>
  );
}
