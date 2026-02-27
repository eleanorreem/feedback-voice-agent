'use client';

import { useMemo } from 'react';
import { AiNarrative } from '@/components/app/ai-narrative';
import { MoodTimeline } from '@/components/app/mood-timeline';
import { TagCloud } from '@/components/app/tag-cloud';
import type { Reflection } from '@/hooks/useReflections';

interface InsightsViewProps {
  reflections: Reflection[];
  loading: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-6 text-xs tracking-widest uppercase">{children}</p>
  );
}

export function InsightsView({ reflections, loading }: InsightsViewProps) {
  const stats = useMemo(() => {
    const totalSessions = reflections.length;
    const totalSeconds = reflections.reduce((sum, r) => sum + (r.session_length_seconds ?? 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    const firstDate =
      reflections.length > 0
        ? new Date(
            Math.min(...reflections.map((r) => new Date(r.timestamp).getTime()))
          ).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    return { totalSessions, totalMinutes, firstDate };
  }, [reflections]);

  const tagFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reflections) {
      for (const tag of r.tags ?? []) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [reflections]);

  const themeFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reflections) {
      for (const theme of r.themes ?? []) {
        counts[theme] = (counts[theme] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [reflections]);

  const moodEntries = useMemo(
    () =>
      reflections
        .filter((r) => r.mood)
        .map((r) => ({ date: r.date, mood: r.mood! }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [reflections]
  );

  if (loading) {
    return (
      <div className="text-muted-foreground py-24 text-center text-sm">Loading…</div>
    );
  }

  if (reflections.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground text-sm">
          Complete your first session to start discovering your themes and patterns.
        </p>
      </div>
    );
  }

  const timeDisplay =
    stats.totalMinutes >= 60
      ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
      : `${stats.totalMinutes}m`;

  return (
    <div className="space-y-20 pb-16">

      {/* Stats */}
      <div className="flex gap-12 pt-4">
        <div>
          <p className="text-foreground text-5xl font-semibold tabular-nums leading-none">
            {stats.totalSessions}
          </p>
          <p className="text-muted-foreground mt-2 text-xs tracking-wide">
            {stats.totalSessions === 1 ? 'session' : 'sessions'}
          </p>
        </div>
        {stats.totalMinutes > 0 && (
          <div>
            <p className="text-foreground text-5xl font-semibold tabular-nums leading-none">
              {timeDisplay}
            </p>
            <p className="text-muted-foreground mt-2 text-xs tracking-wide">journaling time</p>
          </div>
        )}
        {stats.firstDate && (
          <div>
            <p className="text-foreground text-5xl font-semibold leading-none">{stats.firstDate}</p>
            <p className="text-muted-foreground mt-2 text-xs tracking-wide">first session</p>
          </div>
        )}
      </div>

      {/* Tags */}
      {tagFrequency.length > 0 && (
        <div>
          <SectionLabel>What you talk about most</SectionLabel>
          <TagCloud items={tagFrequency} variant="tags" />
        </div>
      )}

      {/* Themes */}
      {themeFrequency.length > 0 && (
        <div>
          <SectionLabel>Recurring themes</SectionLabel>
          <TagCloud items={themeFrequency} variant="themes" />
        </div>
      )}

      {/* Mood timeline */}
      {moodEntries.length > 0 && (
        <div>
          <SectionLabel>Emotional landscape</SectionLabel>
          <MoodTimeline entries={moodEntries} />
        </div>
      )}

      {/* AI narrative */}
      <div>
        <SectionLabel>Your journaling portrait</SectionLabel>
        <AiNarrative reflections={reflections} />
      </div>

    </div>
  );
}
