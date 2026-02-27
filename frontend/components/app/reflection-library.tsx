'use client';

import { useEffect, useState } from 'react';
import { ReflectionCard } from '@/components/app/reflection-card';
import type { Reflection } from '@/hooks/useReflections';

interface ReflectionLibraryProps {
  reflections: Reflection[];
  loading: boolean;
  tagFilter: string | null;
  onFilterByTag: (tag: string | null) => void;
}

export function ReflectionLibrary({
  reflections,
  loading,
  tagFilter,
  onFilterByTag,
}: ReflectionLibraryProps) {
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => setAllTags(data.tags ?? []))
      .catch(() => {});
  }, [reflections]);

  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">Loading reflections...</div>
    );
  }

  return (
    <div className="w-full">
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => onFilterByTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tagFilter === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onFilterByTag(tagFilter === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tagFilter === tag
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Reflection list */}
      {reflections.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center text-sm">
          {tagFilter
            ? `No reflections found with tag #${tagFilter}`
            : 'No reflections yet. Start a session to begin your journaling practice.'}
        </div>
      ) : (
        <div className="space-y-3">
          {reflections.map((reflection) => (
            <ReflectionCard key={reflection.id} reflection={reflection} />
          ))}
        </div>
      )}
    </div>
  );
}
