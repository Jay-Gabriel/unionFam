export interface PrivacyEventPayload {
  eventName:
    | 'journey_started'
    | 'first_value_confirmed'
    | 'decision_saved'
    | 'experiment_started'
    | 'checkin_saved'
    | 'review_completed'
    | 'journey_paused'
    | 'sync_failed'
    | 'ai_failed';
  opaqueUserId: string;
  opaqueDecisionId?: string;
  durationDays?: number;
}

interface LoggedEvent extends PrivacyEventPayload {
  eventId: string;
  timestamp: number;
}

const loggedEvents: LoggedEvent[] = [];

export const trackPrivacyEvent = (payload: PrivacyEventPayload): void => {
  loggedEvents.push({
    ...payload,
    eventId: 'evt_' + Math.random().toString(36).substring(2),
    timestamp: Date.now()
  });
};

export const getLoggedEvents = (): LoggedEvent[] => [...loggedEvents];

export const clearTelemetry = (): void => {
  loggedEvents.length = 0;
};
