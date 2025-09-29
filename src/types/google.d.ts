// Google Identity Services TypeScript declarations

interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface IdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
}

interface GoogleAccounts {
  id: {
    initialize: (input: IdConfiguration) => void;
    prompt: (momentListener?: (res: PromptMomentNotification) => void) => void;
    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    disableAutoSelect: () => void;
    storeCredential: (credentials: { id: string; password: string }, callback: () => void) => void;
    cancel: () => void;
    onGoogleLibraryLoad: () => void;
    revoke: (accessToken: string, done: () => void) => void;
  };
}

interface Window {
  google?: {
    accounts: GoogleAccounts;
  };
}
