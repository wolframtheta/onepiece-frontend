import { ApplicationConfig, provideBrowserGlobalErrorListeners, makeStateKey, TransferState, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { APP_CONFIG, AppConfig } from './config';
import { authInterceptor } from './interceptors/auth.interceptor';

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
        let apiUrl: string;
        
        // Try to get from TransferState first (for client-side hydration)
        if (transferState.hasKey(API_URL_KEY)) {
          apiUrl = transferState.get(API_URL_KEY, 'http://localhost:3001/api');
        } else {
          // Server-side: read from environment and store in TransferState
          apiUrl = typeof process !== 'undefined' && process.env?.['API_URL']
            ? process.env['API_URL']
            : 'http://localhost:3001/api';
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
