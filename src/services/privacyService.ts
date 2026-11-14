import { PrivacyScope } from '../types/decisionJourney';

let currentScope: PrivacyScope = 'card_only';

export const setPrivacyScope = (scope: PrivacyScope): void => {
  currentScope = scope;
};

export const getPrivacyScope = (): PrivacyScope => currentScope;

export const shouldPersistTranscript = (): boolean => currentScope === 'card_and_transcript';

export const clearAllSessionData = (): void => {
  currentScope = 'card_only';
};
