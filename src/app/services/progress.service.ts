import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { APP_CONFIG } from '../config';

export interface WatchProgress {
  id: string;
  episodeId: number;
  seasonId: number;
  showId: number;
  episodeName?: string;
  seasonName?: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  updatedAt: string;
}

export interface IntroConfig {
  default: { start: number; end: number };
  episodes: Record<string, { start: number; end: number }>;
}

export interface SaveProgressPayload {
  episodeId: number;
  seasonId: number;
  showId: number;
  episodeName?: string;
  seasonName?: string;
  currentTime: number;
  duration: number;
}

export interface MarkCompletedPayload {
  episodeId: number;
  seasonId: number;
  showId: number;
  episodeName?: string;
  seasonName?: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  getRecentProgress(): Observable<WatchProgress[]> {
    return this.http.get<WatchProgress[]>(`${this.config.apiUrl}/progress/recent`);
  }

  getLastProgress(): Observable<WatchProgress | null> {
    return this.http.get<WatchProgress | null>(`${this.config.apiUrl}/progress/latest`)
      .pipe(
        catchError(() => of(null))
      );
  }

  getEpisodeProgress(episodeId: number): Observable<WatchProgress | null> {
    return this.http.get<WatchProgress>(`${this.config.apiUrl}/progress/episode/${episodeId}`)
      .pipe(
        catchError(() => of(null))
      );
  }

  saveProgress(payload: SaveProgressPayload): Observable<WatchProgress> {
    return this.http.put<WatchProgress>(`${this.config.apiUrl}/progress`, payload);
  }

  markCompleted(payload: MarkCompletedPayload): Observable<WatchProgress> {
    return this.http.put<WatchProgress>(`${this.config.apiUrl}/progress`, {
      ...payload,
      currentTime: payload.completed ? 1 : 0,
      duration: 1,
    });
  }

  getIntroConfig(): Observable<IntroConfig> {
    return this.http.get<IntroConfig>(`${this.config.apiUrl}/config/intro`);
  }
}
