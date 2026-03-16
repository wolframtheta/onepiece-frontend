import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { APP_CONFIG } from '../config';

// Original API returns Spanish field names (nom = name)
interface ShowResponse {
  id: number;
  nom: string;
  description?: string;
  thumbnail?: string;
  cover?: string;
  playlists?: SeasonResponse[];
}

interface SeasonResponse {
  id: number;
  nom: string;
  description?: string;
  cover?: string;
  show_id: number;
  app: boolean;
}

interface EpisodeResponse {
  id: number;
  nom: string;
  show_id: number;
  url: string;
}

interface PlaylistResponse {
  id: number;
  nom: string;
  description?: string;
  cover?: string;
  show_id: number;
  app: boolean;
  videos?: EpisodeResponse[];
}

// Normalized types for the app
export interface Show {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  cover?: string;
  playlists?: Season[];
}

export interface Season {
  id: number;
  name: string;
  description?: string;
  cover?: string;
  showId: number;
  app: boolean;
}

export interface Episode {
  id: number;
  name: string;
  showId: number;
  url: string;
}

export interface Playlist {
  id: number;
  name: string;
  description?: string;
  cover?: string;
  showId: number;
  app: boolean;
  videos?: Episode[];
}

@Injectable({
  providedIn: 'root'
})
export class ShowsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  getShow(showId: number): Observable<Show> {
    return this.http.get<ShowResponse>(`${this.config.apiUrl}/xarxa/shows/${showId}`)
      .pipe(
        map(response => ({
          id: response.id,
          name: response.nom,
          description: response.description,
          thumbnail: response.thumbnail,
          cover: response.cover,
          playlists: response.playlists?.map(p => ({
            id: p.id,
            name: p.nom,
            description: p.description,
            cover: p.cover,
            showId: p.show_id,
            app: p.app
          }))
        }))
      );
  }

  getSeasons(showId: number): Observable<Season[]> {
    return this.getShow(showId).pipe(
      map(show => (show.playlists?.filter(p => !p.app) || []))
    );
  }

  getPlaylist(playlistId: number): Observable<Playlist> {
    return this.http.get<PlaylistResponse>(`${this.config.apiUrl}/xarxa/playlists/${playlistId}`)
      .pipe(
        map(response => ({
          id: response.id,
          name: response.nom,
          description: response.description,
          cover: response.cover,
          showId: response.show_id,
          app: response.app,
          videos: response.videos?.map(v => ({
            id: v.id,
            name: v.nom,
            showId: v.show_id,
            url: v.url
          }))
        }))
      );
  }
}
