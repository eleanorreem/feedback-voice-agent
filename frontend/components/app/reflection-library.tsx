'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { DiaryLeftPage, DiaryRightPage } from '@/components/app/reflection-card';
import type { Reflection } from '@/hooks/useReflections';
import { getTagStyle } from '@/lib/tags';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const directionRef = useRef(1);
  // When the user picks an entry from the tag list, we store its ID
  // so we can jump to it once the unfiltered list reloads.
  const jumpToIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => setAllTags(data.tags ?? []))
      .catch(() => {});
  }, [reflections]);

  // Reset to first page when reflections change, or jump to a specific entry
  useEffect(() => {
    if (jumpToIdRef.current) {
      const idx = reflections.findIndex((r) => r.id === jumpToIdRef.current);
      setCurrentIndex(idx >= 0 ? idx : 0);
      jumpToIdRef.current = null;
    } else {
      setCurrentIndex(0);
    }
  }, [reflections]);

  const goNewer = () => {
    directionRef.current = -1;
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const goOlder = () => {
    directionRef.current = 1;
    setCurrentIndex((i) => Math.min(reflections.length - 1, i + 1));
  };

  const selectEntry = (id: string) => {
    jumpToIdRef.current = id;
    onFilterByTag(null);
  };

  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">Loading reflections...</div>
    );
  }

  const total = reflections.length;
  const current = reflections[currentIndex] ?? null;

  // When a tag is active, show a list of matching entries instead of the diary
  const showList = tagFilter !== null;

  return (
    <div className="w-full">
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <button
            onClick={() => onFilterByTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tagFilter === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onFilterByTag(tagFilter === tag ? null : tag)}
              style={tagFilter === tag ? undefined : getTagStyle(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tagFilter === tag ? 'bg-primary text-primary-foreground' : 'hover:opacity-80'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="text-muted-foreground py-12 text-center text-sm">
          {tagFilter
            ? `No reflections found with tag #${tagFilter}`
            : 'No reflections yet. Start a session to begin your journaling practice.'}
        </div>
      )}

      {/* Tag list view — shows matching entries as clickable cards */}
      {total > 0 && showList && (
        <div className="space-y-2">
          {reflections.map((r) => {
            const date = new Date(r.date).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const preview =
              r.summary_text?.slice(0, 100) + (r.summary_text?.length > 100 ? '...' : '');

            return (
              <button
                key={r.id}
                onClick={() => selectEntry(r.id)}
                className="bg-card flex w-full cursor-pointer items-start gap-4 rounded-xl p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">{date}</span>
                    {r.mood && (
                      <span className="text-muted-foreground text-xs italic">{r.mood}</span>
                    )}
                  </div>
                  {preview && (
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{preview}</p>
                  )}
                </div>
                <CaretRight size={16} className="text-muted-foreground mt-1 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Diary view — open book spread */}
      {total > 0 && !showList && (
        <div>
          {/* Book container with perspective for 3D flip */}
          <div style={{ perspective: '1200px' }}>
            <AnimatePresence mode="wait" initial={false}>
              {current && (
                <motion.div
                  key={currentIndex}
                  custom={directionRef.current}
                  variants={{
                    enter: (dir: number) => ({
                      opacity: 0,
                      x: dir * 80,
                      rotateY: dir * -3,
                    }),
                    center: {
                      opacity: 1,
                      x: 0,
                      rotateY: 0,
                    },
                    exit: (dir: number) => ({
                      opacity: 0,
                      x: dir * -80,
                      rotateY: dir * 3,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Open book spread */}
                  <div className="bg-card overflow-hidden rounded-2xl shadow-lg">
                    {/* Desktop: two-page spread */}
                    <div className="hidden lg:grid lg:grid-cols-2">
                      {/* Left page */}
                      <div className="border-border relative border-r p-8">
                        {/* Gutter shadow on right edge */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/[0.03] to-transparent dark:from-black/10" />
                        <DiaryLeftPage reflection={current} />
                        <div className="text-muted-foreground/50 mt-6 text-xs">
                          page {currentIndex * 2 + 1}
                        </div>
                      </div>

                      {/* Right page */}
                      <div className="relative p-8">
                        {/* Gutter shadow on left edge */}
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/[0.03] to-transparent dark:from-black/10" />
                        <DiaryRightPage reflection={current} />
                        <div className="text-muted-foreground/50 mt-6 text-right text-xs">
                          page {currentIndex * 2 + 2}
                        </div>
                      </div>
                    </div>

                    {/* Mobile: single column stacked */}
                    <div className="space-y-6 p-6 lg:hidden">
                      <DiaryLeftPage reflection={current} />
                      <DiaryRightPage reflection={current} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {total > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={goNewer}
                disabled={currentIndex === 0}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors disabled:opacity-30"
              >
                <CaretLeft size={14} weight="bold" />
                Newer
              </button>
              <span className="text-muted-foreground text-xs">
                Entry {currentIndex + 1} of {total}
              </span>
              <button
                onClick={goOlder}
                disabled={currentIndex === total - 1}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors disabled:opacity-30"
              >
                Older
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
