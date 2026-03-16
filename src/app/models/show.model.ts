export interface Show {
  id: number;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  playlists?: Playlist[];
}

export interface Playlist {
  id: number;
  name: string;
  slug: string;
  showId: number;
  position: number;
  app?: boolean;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  slug: string;
  position: number;
  playlistId: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}
