import { createHash } from 'node:crypto';
import { createAdminClient } from '@/server/db/admin';

type ObservabilityBase = {
  requestId: string;
  userId?: string;
};

function userHash(userId?: string) {
  if (!userId) return null;
  return createHash('sha256').update(userId).digest('hex').slice(0, 24);
}

/**
 * Operational logs are deliberately best-effort. A missing service-role key or
 * a temporary logging outage must not turn a valid user action into a 5xx.
 * Raw prompts, messages, emails and provider payloads are never accepted here.
 */
export async function recordApplicationError(
  params: ObservabilityBase & {
    errorCode: string;
    route: string;
    detail?: Record<string, string | number | boolean | null>;
  }
) {
  try {
    const service = createAdminClient();
    await service.from('application_errors').insert({
      request_id: params.requestId,
      error_code: params.errorCode.slice(0, 120),
      route: params.route.slice(0, 240),
      user_hash: userHash(params.userId),
      sanitized_detail: params.detail || {},
    });
  } catch (error) {
    console.error('OBSERVABILITY_WRITE_FAILED', error instanceof Error ? error.name : 'UnknownError');
  }
}

export async function recordAiRunLog(
  params: ObservabilityBase & {
    provider: string;
    model: string;
    latencyMs: number;
    status: string;
    errorCode?: string;
    promptTokens?: number;
    completionTokens?: number;
  }
) {
  try {
    const service = createAdminClient();
    await service.from('ai_run_logs').insert({
      request_id: params.requestId,
      user_hash: userHash(params.userId) || 'anonymous',
      provider: params.provider.slice(0, 64),
      model: params.model.slice(0, 120),
      latency_ms: Math.max(0, Math.round(params.latencyMs)),
      prompt_tokens: Math.max(0, Math.round(params.promptTokens || 0)),
      completion_tokens: Math.max(0, Math.round(params.completionTokens || 0)),
      status: params.status.slice(0, 64),
      error_code: params.errorCode?.slice(0, 120) || null,
    });
  } catch (error) {
    console.error('OBSERVABILITY_WRITE_FAILED', error instanceof Error ? error.name : 'UnknownError');
  }
}
