import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { APP_CONFIG, AppConfig } from './config';
import { authInterceptor } from './interceptors/auth.interceptor';

// Read API URL from environment variable or use default
const apiUrl = typeof process !== 'undefined' && process.env?.['API_URL'] 
  ? process.env['API_URL'] 
  : 'http://localhost:3001/api';

const appConfigValue: AppConfig = {
  apiUrl,
  currentShow: {
    id: 4,
    name: 'One Piece',
    slug: 'one-piece',
    apiBase: 'https://gestio.multimedia.xarxacatala.cat/api/v2',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: APP_CONFIG, useValue: appConfigValue }
  ]
};
