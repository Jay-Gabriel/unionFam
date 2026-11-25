export type RouteState =
  | { name: 'landing' }
  | { name: 'start' }
  | { name: 'today' }
  | { name: 'decisions' }
  | { name: 'decision_detail'; decisionId: string }
  | { name: 'experiment_setup'; decisionId: string }
  | { name: 'checkin'; decisionId: string }
  | { name: 'review'; decisionId: string }
  | { name: 'privacy' };

export const parseRoute = (path: string): RouteState => {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/') return { name: 'landing' };
  if (clean === '/start') return { name: 'start' };
  if (clean === '/today') return { name: 'today' };
  if (clean === '/decisions') return { name: 'decisions' };
  if (clean === '/settings/privacy') return { name: 'privacy' };

  const matchExp = clean.match(/^\/decisions\/([^/]+)\/experiment$/);
  if (matchExp) return { name: 'experiment_setup', decisionId: matchExp[1] };

  const matchCheckin = clean.match(/^\/decisions\/([^/]+)\/checkin$/);
  if (matchCheckin) return { name: 'checkin', decisionId: matchCheckin[1] };

  const matchRev = clean.match(/^\/decisions\/([^/]+)\/review$/);
  if (matchRev) return { name: 'review', decisionId: matchRev[1] };

  const matchDetail = clean.match(/^\/decisions\/([^/]+)$/);
  if (matchDetail) return { name: 'decision_detail', decisionId: matchDetail[1] };

  return { name: 'landing' };
};

export const navigateTo = (path: string): void => {
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};
