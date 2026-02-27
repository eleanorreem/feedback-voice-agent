'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import type { Reflection } from '@/hooks/useReflections';

interface AiNarrativeProps {
  reflections: Reflection[];
}

export function AiNarrative({ reflections }: AiNarrativeProps) {
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setNarrative('');
    setGenerated(false);

    try {
      const response = await fetch('/api/insights/narrative', { method: 'POST' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to generate');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setNarrative((prev) => prev + text);
      }

      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = reflections.length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {canGenerate
              ? 'An AI-written reflection on patterns and themes across your sessions.'
              : 'Add at least 2 sessions to generate a synthesis.'}
          </p>
        </div>
        {canGenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={generate}
            disabled={loading}
            className="ml-4 shrink-0 rounded-full font-mono text-xs tracking-wider uppercase"
          >
            {loading ? 'Writing…' : generated ? 'Regenerate' : 'Generate'}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {loading && !narrative && (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-2"
          >
            <div className="border-muted border-t-muted-foreground h-4 w-4 animate-spin rounded-full border-2" />
            <span className="text-muted-foreground text-sm">Reading your sessions…</span>
          </motion.div>
        )}

        {narrative && (
          <motion.div
            key="narrative"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-muted/30 border-border rounded-lg border px-4 py-4"
          >
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{narrative}</p>
          </motion.div>
        )}

        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-destructive text-sm"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
