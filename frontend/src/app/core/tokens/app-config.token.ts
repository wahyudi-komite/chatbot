import { InjectionToken } from '@angular/core';

export interface FrontendAppConfig {
  apiBaseUrl: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<FrontendAppConfig>;
  }
}

export const APP_CONFIG = new InjectionToken<FrontendAppConfig>('APP_CONFIG', {
  factory: () => ({
    apiBaseUrl: window.__APP_CONFIG__?.apiBaseUrl ?? 'http://localhost:3000/api',
  }),
});
