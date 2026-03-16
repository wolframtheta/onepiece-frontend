export interface Progress {
  id: number;
  userId: number;
  episodeId: number;
  position: number;
  completed: boolean;
  updatedAt: string;
  episode?: {
    id: number;
    name: string;
    slug: string;
    position: number;
    playlistId: number;
    playlist?: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export interface IntroConfig {
  start: number;
  end: number;
}
