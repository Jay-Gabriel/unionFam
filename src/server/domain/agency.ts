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

export async function processObservationDecision(params: DecisionParams): Promise<DecisionResult> {
  const { userId, observationId, decision, editedContent } = params;

  if (decision === 'accepted') {
    const finalContent = editedContent && editedContent.trim() !== '' ? editedContent : 'Original observation content';
    return {
      observationId,
      status: 'accepted',
      insightId: `insight-${Date.now()}`,
      confirmedContent: finalContent,
    };
  }

  return {
    observationId,
    status: 'rejected',
  };
}
