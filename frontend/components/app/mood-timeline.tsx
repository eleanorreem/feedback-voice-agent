'use client';

import { motion } from 'motion/react';

interface MoodEntry {
  date: string;
  mood: string;
}

interface MoodTimelineProps {
  entries: MoodEntry[];
}

function getMoodColor(mood: string): string {
  const m = mood.toLowerCase();
  if (/hopeful|excited|happy|joyful|energi[sz]ed|motivated|inspired|great|good/.test(m))
    return 'var(--chart-4)';
  if (/proud|accomplish|grateful|content|fulfilled|satisfied/.test(m)) return 'var(--chart-2)';
  if (/reflect|thought|pensive|contemplat|calm|peace|settled|curious/.test(m))
    return 'var(--chart-3)';
  if (/tired|exhaust|low|down|sad|melanchol|drained|numb/.test(m)) return 'var(--chart-1)';
  if (/anxious|stress|overwhelm|frustrat|anger|angry|difficult|struggle|worried/.test(m))
    return 'var(--chart-5)';
  return 'var(--foreground)';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function MoodTimeline({ entries }: MoodTimelineProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => (
        <motion.div
          key={`${entry.date}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          className="flex items-center gap-5 py-3 border-b border-border/40 last:border-0"
        >
          {/* Dot */}
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: getMoodColor(entry.mood) }}
          />

          {/* Mood */}
          <span className="text-foreground text-sm flex-1">{entry.mood}</span>

          {/* Date */}
          <span className="text-muted-foreground text-xs tabular-nums">{formatDate(entry.date)}</span>
        </motion.div>
      ))}
    </div>
  );
}
