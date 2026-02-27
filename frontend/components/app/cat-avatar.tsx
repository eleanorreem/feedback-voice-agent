'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';
import { motion } from 'motion/react';
import {
  type AgentState,
  type TrackReferenceOrPlaceholder,
  useMultibandTrackVolume,
} from '@livekit/components-react';
import { cn } from '@/lib/shadcn/utils';

function useBlink() {
  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scheduleBlink = useCallback(() => {
    const delay = 2000 + Math.random() * 4000;
    timeoutRef.current = setTimeout(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        scheduleBlink();
      }, 150);
    }, delay);
  }, []);

  useEffect(() => {
    scheduleBlink();
    return () => clearTimeout(timeoutRef.current);
  }, [scheduleBlink]);

  return isBlinking;
}

interface CatAvatarProps {
  state: AgentState;
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
  className?: string;
}

export function CatAvatar({ state, audioTrack, className }: CatAvatarProps) {
  const volumeBands = useMultibandTrackVolume(audioTrack, {
    bands: 3,
    loPass: 100,
    hiPass: 200,
  });

  const mouthOpenness = useMemo(() => {
    if (state !== 'speaking') return 0;
    const avg = volumeBands.reduce((sum, v) => sum + v, 0) / volumeBands.length;
    return Math.min(1, avg * 1.5);
  }, [state, volumeBands]);

  const isBlinking = useBlink();
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  const mouthOpenRy = mouthOpenness * 8;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('overflow-visible', className)}
    >
      {/* Breathing animation wrapper */}
      <motion.g
        animate={{
          scale: !isSpeaking ? [1, 1.015, 1] : 1,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '50px 55px' }}
      >
        {/* Left ear */}
        <motion.polygon
          points="18,30 25,8 38,28"
          fill="var(--muted)"
          stroke="color-mix(in oklch, var(--foreground) 15%, transparent)"
          strokeWidth="1"
          animate={{
            rotate: isListening ? [0, -5, 0, 5, 0] : 0,
          }}
          transition={{
            duration: 1.5,
            repeat: isListening ? Infinity : 0,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '28px 28px' }}
        />
        <polygon points="22,27 26,14 35,26" fill="#FFB6C1" opacity="0.6" />

        {/* Right ear */}
        <motion.polygon
          points="62,28 75,8 82,30"
          fill="var(--muted)"
          stroke="color-mix(in oklch, var(--foreground) 15%, transparent)"
          strokeWidth="1"
          animate={{
            rotate: isListening ? [0, 5, 0, -5, 0] : 0,
          }}
          transition={{
            duration: 1.5,
            repeat: isListening ? Infinity : 0,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '72px 28px' }}
        />
        <polygon points="65,27 74,14 79,26" fill="#FFB6C1" opacity="0.6" />

        {/* Face */}
        <ellipse
          cx="50"
          cy="55"
          rx="35"
          ry="32"
          fill="var(--muted)"
          stroke="color-mix(in oklch, var(--foreground) 15%, transparent)"
          strokeWidth="1"
        />

        {/* Left eye */}
        <motion.g
          animate={{ scaleY: isBlinking ? 0.1 : 1 }}
          transition={{ duration: 0.08 }}
          style={{ transformOrigin: '38px 48px' }}
        >
          <ellipse cx="38" cy="48" rx="5" ry="6" fill="var(--background)" />
          <motion.ellipse
            cx={38}
            ry={3}
            rx={2.5}
            fill="var(--foreground)"
            animate={{
              cy: isThinking ? 46 : 49,
              cx: isThinking ? 36 : 38,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Right eye */}
        <motion.g
          animate={{ scaleY: isBlinking ? 0.1 : 1 }}
          transition={{ duration: 0.08 }}
          style={{ transformOrigin: '62px 48px' }}
        >
          <ellipse cx="62" cy="48" rx="5" ry="6" fill="var(--background)" />
          <motion.ellipse
            cx={62}
            ry={3}
            rx={2.5}
            fill="var(--foreground)"
            animate={{
              cy: isThinking ? 46 : 49,
              cx: isThinking ? 60 : 62,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Nose */}
        <polygon
          points="50,56 47.5,53 52.5,53"
          fill="color-mix(in oklch, var(--foreground) 50%, transparent)"
        />

        {/* Mouth - resting smile */}
        <motion.path
          d="M 44,58 Q 50,62 56,58"
          fill="none"
          stroke="color-mix(in oklch, var(--foreground) 50%, transparent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{ opacity: mouthOpenness > 0.05 ? 0 : 1 }}
          transition={{ duration: 0.05 }}
        />

        {/* Mouth - open (speaking) */}
        <motion.ellipse
          cx={50}
          cy={60}
          fill="color-mix(in oklch, var(--foreground) 85%, transparent)"
          animate={{
            rx: 4 + mouthOpenness * 2,
            ry: Math.max(0.5, mouthOpenRy),
            opacity: mouthOpenness > 0.05 ? 1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 800,
            damping: 30,
          }}
        />

        {/* Whiskers - left */}
        <line x1="10" y1="50" x2="32" y2="53" stroke="var(--muted-foreground)" strokeWidth="0.8" />
        <line x1="10" y1="55" x2="32" y2="56" stroke="var(--muted-foreground)" strokeWidth="0.8" />
        <line x1="10" y1="60" x2="32" y2="59" stroke="var(--muted-foreground)" strokeWidth="0.8" />

        {/* Whiskers - right */}
        <line x1="90" y1="50" x2="68" y2="53" stroke="var(--muted-foreground)" strokeWidth="0.8" />
        <line x1="90" y1="55" x2="68" y2="56" stroke="var(--muted-foreground)" strokeWidth="0.8" />
        <line x1="90" y1="60" x2="68" y2="59" stroke="var(--muted-foreground)" strokeWidth="0.8" />
      </motion.g>
    </svg>
  );
}
