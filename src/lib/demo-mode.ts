/**
 * Explicit, non-persistent preview mode for deployments that do not have
 * Supabase configured. Keep this opt-in so a missing production database
 * never silently disables authentication or persistence.
 */
export function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
