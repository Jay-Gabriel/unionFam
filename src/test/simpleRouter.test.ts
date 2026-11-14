import { describe, it, expect } from 'vitest';
import { parseRoute } from '../router/SimpleRouter';

describe('App Router Route Parser', () => {
  it('should parse landing, start, today and decisions routes correctly', () => {
    expect(parseRoute('/')).toEqual({ name: 'landing' });
    expect(parseRoute('/start')).toEqual({ name: 'start' });
    expect(parseRoute('/today')).toEqual({ name: 'today' });
    expect(parseRoute('/decisions')).toEqual({ name: 'decisions' });
  });

  it('should parse parameterized decision routes and privacy settings', () => {
    expect(parseRoute('/decisions/dec-123')).toEqual({ name: 'decision_detail', decisionId: 'dec-123' });
    expect(parseRoute('/decisions/dec-123/experiment')).toEqual({ name: 'experiment_setup', decisionId: 'dec-123' });
    expect(parseRoute('/decisions/dec-123/review')).toEqual({ name: 'review', decisionId: 'dec-123' });
    expect(parseRoute('/settings/privacy')).toEqual({ name: 'privacy' });
  });
});
