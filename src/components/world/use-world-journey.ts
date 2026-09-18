'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildWorldJourney, type WorldJourneySource } from './world-journey';

type ProfileResponse = {
  data?: {
    snapshot?: { dimensions?: Record<string, { summary?: string; current_state?: string; desired_state?: string }> };
  };
};

type ProgressResponse = {
  data?: {
    questionnaireProgress?: number;
    conversations?: number;
    activeExperimentProgress?: number;
    streak?: number;
  };
};

export function useWorldJourney(collectedLetters: number, refreshToken = 0) {
  const [source, setSource] = useState<WorldJourneySource>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/progress').then((response) => response.ok ? response.json() as Promise<ProgressResponse> : { data: {} }),
      fetch('/api/life-profile').then((response) => response.ok ? response.json() as Promise<ProfileResponse> : { data: {} }),
    ])
      .then(([progress, profile]) => {
        if (cancelled) return;
        const dimensions = profile.data?.snapshot?.dimensions || {};
        const profileDimensionCount = Object.values(dimensions).filter((dimension) =>
          Boolean(dimension?.summary?.trim() || dimension?.current_state?.trim() || dimension?.desired_state?.trim())
        ).length;
        setSource({
          questionnaireProgress: progress.data?.questionnaireProgress || 0,
          conversations: progress.data?.conversations || 0,
          activeExperimentProgress: progress.data?.activeExperimentProgress || 0,
          streak: progress.data?.streak || 0,
          profileDimensionCount,
        });
      })
      .catch(() => {
        if (!cancelled) setSource({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [refreshToken]);

  return useMemo(
    () => buildWorldJourney({ ...source, collectedLetters }, loading),
    [source, collectedLetters, loading]
  );
}
