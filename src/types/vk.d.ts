// VK ID SDK Type Definitions

interface VKIDConfig {
  init(config: {
    app: number;
    redirectUrl: string;
    responseMode: string;
    source: string;
    scope: string;
  }): void;
  ConfigResponseMode: {
    Callback: string;
  };
  ConfigSource: {
    LOWCODE: string;
  };
}

interface VKIDOneTap {
  render(options: {
    container: HTMLElement;
    showAlternativeLogin: boolean;
  }): VKIDOneTap;
  on(event: string, callback: (payload?: unknown) => void): VKIDOneTap;
}

interface VKIDAuth {
  exchangeCode(code: string, deviceId: string): Promise<{
    access_token: string;
    user_id: number;
  }>;
}

interface VKIDSDK {
  Config: VKIDConfig;
  OneTap: new () => VKIDOneTap;
  Auth: VKIDAuth;
  WidgetEvents: {
    ERROR: string;
  };
  OneTapInternalEvents: {
    LOGIN_SUCCESS: string;
  };
  ConfigResponseMode: {
    Callback: string;
  };
  ConfigSource: {
    LOWCODE: string;
  };
}

declare global {
  interface Window {
    VKIDSDK?: VKIDSDK;
  }
}

export {};

