import { ApplicationConfig, provideBrowserGlobalErrorListeners, makeStateKey, TransferState, inject, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { APP_CONFIG, AppConfig } from './config';
import { authInterceptor } from './interceptors/auth.interceptor';
import { environment } from '../environments/environment';

// Key for TransferState
const API_URL_KEY = makeStateKey<string>('apiUrl');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => {
        const transferState = inject(TransferState);
        const platformId = inject(PLATFORM_ID);
        let apiUrl: string;
        
        // Try to get from TransferState first (for client-side hydration)
        if (transferState.hasKey(API_URL_KEY)) {
          apiUrl = transferState.get(API_URL_KEY, environment.apiUrl);
        } else {
          // Server-side: prioritize process.env (Coolify), fallback to environment
          if (isPlatformServer(platformId) && typeof process !== 'undefined' && process.env?.['API_URL']) {
            apiUrl = process.env['API_URL'];
          } else {
            apiUrl = environment.apiUrl;
          }
          transferState.set(API_URL_KEY, apiUrl);
        }

        return {
          apiUrl,
          currentShow: {
            id: 4,
            name: 'One Piece',
            slug: 'one-piece',
            apiBase: 'https://gestio.multimedia.xarxacatala.cat/api/v2',
          },
        };
      },
    }
  ]
};
