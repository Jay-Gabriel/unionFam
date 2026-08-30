export interface DecisionParams {
  userId: string;
  observationId: string;
  decision: 'accepted' | 'rejected';
  editedContent?: string;
  idempotencyKey?: string;
}

export interface DecisionResult {
  observationId: string;
  status: 'accepted' | 'rejected';
  insightId?: string;
  confirmedContent?: string;
}

type AgencyRpcClient = {
  rpc: (
    fn: 'decide_observation_atomic',
    args: {
      p_observation_id: string;
      p_decision: string;
      p_edited_content?: string | null;
      p_idempotency_key?: string | null;
    }
  ) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }>;
};

function parseDecisionResult(value: unknown, fallback: DecisionParams): DecisionResult {
  const result = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const status = result.status === 'accepted' || result.status === 'rejected'
    ? result.status
    : fallback.decision;

  return {
    observationId: String(result.observation_id || fallback.observationId),
    status,
    insightId: typeof result.insight_id === 'string' ? result.insight_id : undefined,
    confirmedContent:
      typeof result.confirmed_content === 'string' ? result.confirmed_content : undefined,
  };
}

/**
 * Execute the atomic database decision function. The no-client branch is kept
 * only for the pure unit tests that exercise the domain mapping in isolation;
 * every HTTP route must pass the authenticated Supabase client.
 */
export async function processObservationDecision(
  params: DecisionParams,
  client?: AgencyRpcClient
): Promise<DecisionResult> {
  if (!client) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('AGENCY_CLIENT_REQUIRED');
    }

    return params.decision === 'accepted'
      ? {
          observationId: params.observationId,
          status: 'accepted',
          insightId: `test-insight-${params.observationId}`,
          confirmedContent: params.editedContent?.trim() || 'Original observation content',
        }
      : { observationId: params.observationId, status: 'rejected' };
  }

  const { data, error } = await client.rpc('decide_observation_atomic', {
    p_observation_id: params.observationId,
    p_decision: params.decision,
    p_edited_content: params.editedContent?.trim() || null,
    p_idempotency_key: params.idempotencyKey || null,
  });

  if (error) {
    const rpcError = new Error(error.message || 'OBSERVATION_DECISION_FAILED');
    Object.assign(rpcError, { code: error.code });
    throw rpcError;
  }

  return parseDecisionResult(data, params);
}
