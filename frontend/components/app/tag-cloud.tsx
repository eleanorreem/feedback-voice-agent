'use client';

import { motion } from 'motion/react';

interface TagCloudItem {
  label: string;
  count: number;
}

interface TagCloudProps {
  items: TagCloudItem[];
  variant?: 'tags' | 'themes';
}

// Returns font size in rem based on relative frequency
function getFontSize(count: number, max: number): string {
  const ratio = max > 1 ? count / max : 1;
  if (ratio > 0.75) return '2rem';
  if (ratio > 0.5) return '1.5rem';
  if (ratio > 0.25) return '1.125rem';
  return '0.875rem';
}

function getOpacity(count: number, max: number): number {
  const ratio = max > 1 ? count / max : 1;
  // Range 0.3 → 1.0
  return Math.round((0.3 + ratio * 0.7) * 100) / 100;
}

export function TagCloud({ items, variant = 'tags' }: TagCloudProps) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => b.count - a.count);
  const max = sorted[0].count;

  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
      {sorted.map((item, i) => {
        const label = variant === 'tags' ? `#${item.label}` : item.label;
        return (
          <motion.span
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: getOpacity(item.count, max) }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            title={`${item.count} ${item.count === 1 ? 'session' : 'sessions'}`}
            className={`cursor-default leading-tight tracking-tight text-foreground ${
              variant === 'tags' ? 'font-mono' : 'font-normal'
            }`}
            style={{ fontSize: getFontSize(item.count, max) }}
          >
            {label}
          </motion.span>
        );
      })}
    </div>
  );
}
