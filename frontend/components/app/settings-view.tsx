'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function SettingsView() {
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async (format: 'json' | 'markdown') => {
    const res = await fetch(`/api/export?format=${format}`);
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      format === 'json' ? 'reflective-journal-export.json' : 'reflective-journal-export.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-12">
        <h1 className="text-foreground mb-8 text-2xl font-semibold">Settings</h1>

        {/* Account info */}
        <section className="mb-8">
          <h2 className="text-foreground mb-3 text-lg font-medium">Account</h2>
          <p className="text-muted-foreground text-sm">
            Signed in as <span className="text-foreground font-medium">{user?.email}</span>
          </p>
        </section>

        {/* Data export */}
        <section className="mb-8">
          <h2 className="text-foreground mb-3 text-lg font-medium">Export your data</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Download all your reflections. You can export as JSON (for data portability) or Markdown
            (for easy reading).
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              Export as JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('markdown')}>
              Export as Markdown
            </Button>
          </div>
        </section>

        {/* Privacy info */}
        <section className="mb-8">
          <h2 className="text-foreground mb-3 text-lg font-medium">Privacy</h2>
          <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
            <li>Your reflections and transcripts are stored securely in our database</li>
            <li>No third-party analytics are run on your reflection content</li>
            <li>
              Each conversation session is isolated — only summaries from previous sessions are
              used, not full transcripts
            </li>
            <li>You can export or delete all your data at any time</li>
          </ul>
        </section>

        {/* Danger zone */}
        <section className="border-destructive/20 rounded-lg border p-4">
          <h2 className="text-destructive mb-3 text-lg font-medium">Delete account</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              Delete my account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-destructive text-sm font-medium">
                Are you absolutely sure? All your reflections, tags, and account data will be
                permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, delete everything'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Back link */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 transition-colors"
          >
            Back to journal
          </Link>
        </div>
      </div>
    </div>
  );
}
