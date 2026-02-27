'use client';

import { useState } from 'react';
import type { SummaryData } from '@/components/app/view-controller';
import { Button } from '@/components/ui/button';
import { PREDEFINED_TAGS, getTagStyle } from '@/lib/tags';

interface SummaryEditorProps {
  summary: SummaryData;
  onSave: () => void;
  onDiscard: () => void;
}

export function SummaryEditor({ summary, onSave, onDiscard }: SummaryEditorProps) {
  const [summaryText, setSummaryText] = useState(summary.summary_text);
  const [mood, setMood] = useState(summary.mood ?? '');
  const [actions, setActions] = useState(summary.actions ?? '');
  const [tags, setTags] = useState<string[]>(summary.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary_text: summaryText,
          themes: summary.themes,
          mood: mood || null,
          actions: actions || null,
          mirror_reflection: summary.mirror_reflection,
          tags,
        }),
      });

      if (res.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-12">
        <h1 className="text-foreground mb-1 text-2xl font-semibold">Your reflection</h1>
        <p className="text-muted-foreground mb-8 text-sm">{today}</p>

        <div className="space-y-6">
          {/* What You Shared */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
              What you shared
            </label>
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              rows={6}
              className="border-input bg-background text-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Themes (read-only display) */}
          {summary.themes.length > 0 && (
            <div>
              <label className="text-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
                Themes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {summary.themes.map((theme) => (
                  <span
                    key={theme}
                    className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mood */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
              Mood
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="border-input bg-background text-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="e.g. reflective, hopeful, tired"
            />
          </div>

          {/* Actions */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
              Actions or intentions
            </label>
            <textarea
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              rows={2}
              className="border-input bg-background text-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:outline-none"
              placeholder="Any intentions or next steps you mentioned (optional)"
            />
          </div>

          {/* Mirror Reflection (read-only) */}
          {summary.mirror_reflection && (
            <div>
              <label className="text-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
                Mirror reflection
              </label>
              <p className="text-muted-foreground bg-muted/30 rounded-md px-3 py-2 text-sm leading-relaxed italic">
                {summary.mirror_reflection}
              </p>
            </div>
          )}

          {/* Tags — predefined picker */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={tags.includes(tag) ? undefined : getTagStyle(tag)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    tags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-full text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save reflection'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDiscard(true)}
              className="rounded-full text-sm font-medium"
            >
              Discard
            </Button>
          </div>

          {/* Discard confirmation */}
          {showDiscard && (
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-foreground mb-3 text-sm">
                Are you sure you want to discard this reflection?
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="destructive" size="sm" onClick={onDiscard}>
                  Yes, discard
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDiscard(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
