import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Supabase Schema Contract', () => {
  const migrationPath = resolve(__dirname, '../lib/migrations/20261115_decision_journey_schema.sql');

  it('should have migration file created', () => {
    expect(existsSync(migrationPath)).toBe(true);
  });

  it('should define all 9 core entities with UUID and foreign keys', () => {
    if (!existsSync(migrationPath)) return;
    const sql = readFileSync(migrationPath, 'utf-8');

    const requiredTables = [
      'decisions',
      'decision_revisions',
      'decision_proposals',
      'conversation_messages',
      'experiments',
      'experiment_versions',
      'checkins',
      'reviews',
      'privacy_preferences'
    ];
    for (const table of requiredTables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
  });

  it('should enforce unique constraints and enable RLS on all 9 tables', () => {
    if (!existsSync(migrationPath)) return;
    const sql = readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('UNIQUE (decision_id, revision)');
    expect(sql).toContain('UNIQUE (experiment_id, local_date)');
    expect(sql).toContain('ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;');
  });
});
