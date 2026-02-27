'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { SessionView } from '@/components/app/session-view';
import { SummaryEditor } from '@/components/app/summary-editor';
import { WelcomeView } from '@/components/app/welcome-view';

export interface SummaryData {
  summary_text: string;
  themes: string[];
  mood: string | null;
  actions: string | null;
  mirror_reflection: string | null;
  tags: string[];
}

type Phase = 'dashboard' | 'session' | 'awaiting_summary' | 'summary_review';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(SessionView);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const session = useSessionContext();
  const { isConnected, start } = session;
  const [phase, setPhase] = useState<Phase>('dashboard');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const sessionStartedAt = useRef<number | null>(null);

  // End the session and transition to summary loading
  const endSession = useCallback(() => {
    if (phase === 'session') {
      session.end();
      setPhase('awaiting_summary');
    }
  }, [phase, session]);

  // Listen for data messages from the agent
  useEffect(() => {
    if (!session.room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(payload));
        if (message.type === 'session_ending') {
          // Agent signalled that the conversation is done
          endSession();
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    session.room.on('dataReceived', handleData);
    return () => {
      session.room?.off('dataReceived', handleData);
    };
  }, [session, session.room, endSession]);

  // Track connection state changes
  useEffect(() => {
    if (isConnected) {
      setPhase('session');
      sessionStartedAt.current = Date.now();
    } else if (phase === 'session') {
      // Session disconnected (e.g. user clicked leave) — wait for summary
      setPhase('awaiting_summary');
    }
  }, [isConnected, phase]);

  // Poll the database for the summary when awaiting
  useEffect(() => {
    if (phase !== 'awaiting_summary') return;

    let cancelled = false;
    const startTime = sessionStartedAt.current ?? Date.now() - 60_000;

    const poll = async () => {
      for (let attempt = 0; attempt < 15; attempt++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 3000));
        if (cancelled) return;

        try {
          const res = await fetch('/api/reflections');
          if (!res.ok) continue;
          const data = await res.json();
          const reflections = data.reflections ?? [];
          if (reflections.length > 0) {
            const latest = reflections[0];
            const createdAt = new Date(latest.created_at).getTime();
            // Only use it if it was created after this session started
            if (createdAt >= startTime - 5000) {
              setSummaryData({
                summary_text: latest.summary_text ?? '',
                themes: latest.themes ?? [],
                mood: latest.mood ?? null,
                actions: latest.actions ?? null,
                mirror_reflection: latest.mirror_reflection ?? null,
                tags: latest.tags ?? [],
              });
              setPhase('summary_review');
              return;
            }
          }
        } catch {
          // retry on error
        }
      }

      // Timed out — go back to dashboard
      if (!cancelled) {
        setPhase('dashboard');
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const handleSummarySaved = useCallback(() => {
    setSummaryData(null);
    setPhase('dashboard');
  }, []);

  const handleSummaryDiscarded = useCallback(() => {
    setSummaryData(null);
    setPhase('dashboard');
  }, []);

  return (
    <AnimatePresence mode="wait">
      {/* Dashboard view */}
      {phase === 'dashboard' && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={start}
        />
      )}
      {/* Session view */}
      {phase === 'session' && isConnected && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          appConfig={appConfig}
          onEndSession={endSession}
        />
      )}
      {/* Awaiting summary */}
      {phase === 'awaiting_summary' && (
        <motion.div
          key="awaiting-summary"
          {...VIEW_MOTION_PROPS}
          className="flex min-h-svh items-center justify-center"
        >
          <div className="text-center">
            <div className="border-muted border-t-foreground mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4" />
            <p className="text-foreground text-lg font-medium">Creating your summary...</p>
            <p className="text-muted-foreground mt-2 text-sm">This usually takes a few seconds</p>
          </div>
        </motion.div>
      )}
      {/* Summary review */}
      {phase === 'summary_review' && summaryData && (
        <motion.div key="summary-review" {...VIEW_MOTION_PROPS}>
          <SummaryEditor
            summary={summaryData}
            onSave={handleSummarySaved}
            onDiscard={handleSummaryDiscarded}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
