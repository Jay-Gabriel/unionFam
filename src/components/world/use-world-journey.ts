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
    completedExperiments?: number;
    confirmedInsights?: number;
    confirmedProfiles?: number;
    reflections?: number;
    confirmedLearnings?: number;
    resources?: number;
  };
};

type GapsResponse = {
  data?: Array<{ status?: string }>;
};

export function useWorldJourney(collectedLetters: number, refreshToken = 0, completedStoryIds: string[] = []) {
  const [source, setSource] = useState<WorldJourneySource>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/progress').then((response) => response.ok ? response.json() as Promise<ProgressResponse> : { data: {} }),
      fetch('/api/life-profile').then((response) => response.ok ? response.json() as Promise<ProfileResponse> : { data: {} }),
      fetch('/api/gaps').then((response) => response.ok ? response.json() as Promise<GapsResponse> : { data: [] }),
    ])
      .then(([progress, profile, gaps]) => {
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
          lifeMapFocuses: Array.isArray(gaps.data) ? gaps.data.filter((gap) => gap.status !== 'resolved').length : 0,
          completedExperiments: progress.data?.completedExperiments || 0,
          confirmedInsights: progress.data?.confirmedInsights || 0,
          confirmedProfiles: progress.data?.confirmedProfiles || 0,
          reflections: progress.data?.reflections || 0,
          confirmedLearnings: progress.data?.confirmedLearnings || 0,
          resources: progress.data?.resources || 0,
          arcadeDiscoveries: completedStoryIds.includes('arcade-discovery') ? 1 : 0,
        });
      })
      .catch(() => {
        if (!cancelled) setSource({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [completedStoryIds, refreshToken]);

  return useMemo(
    () => buildWorldJourney({ ...source, collectedLetters, arcadeDiscoveries: completedStoryIds.includes('arcade-discovery') ? 1 : source.arcadeDiscoveries }, loading),
    [source, collectedLetters, completedStoryIds, loading]
  );
}
