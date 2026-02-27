'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Reflection {
  id: string;
  date: string;
  timestamp: string;
  summary_text: string;
  themes: string[];
  mood: string | null;
  actions: string | null;
  mirror_reflection: string | null;
  session_length_seconds: number;
  tags: string[];
  created_at: string;
}

export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const fetchReflections = useCallback(async (tag?: string | null) => {
    setLoading(true);
    try {
      const url = tag ? `/api/reflections?tag=${encodeURIComponent(tag)}` : '/api/reflections';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReflections(data.reflections ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch reflections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReflections(tagFilter);
  }, [tagFilter, fetchReflections]);

  const filterByTag = useCallback((tag: string | null) => {
    setTagFilter(tag);
  }, []);

  const refresh = useCallback(() => {
    fetchReflections(tagFilter);
  }, [tagFilter, fetchReflections]);

  return { reflections, loading, tagFilter, filterByTag, refresh };
}
