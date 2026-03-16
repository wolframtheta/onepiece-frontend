import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  currentShow: {
    id: number;
    name: string;
    slug: string;
    apiBase: string;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

export const defaultConfig: AppConfig = {
  apiUrl: 'http://localhost:3001/api',
  currentShow: {
    id: 4,
    name: 'One Piece',
    slug: 'one-piece',
    apiBase: 'https://gestio.multimedia.xarxacatala.cat/api/v2',
  },
};
