import { Component, inject, signal, OnInit, computed, ViewChild, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { VideoPlayerComponent, VideoPlayerProps } from '../../components/video-player/video-player.component';
import { ShowsService, Playlist, Episode } from '../../services/shows.service';
import { ProgressService, WatchProgress } from '../../services/progress.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../../config';

interface ActiveEpisode {
  id: number;
  title: string;
  url: string;
  index: number;
}

@Component({
  selector: 'app-season',
  imports: [TopBarComponent, VideoPlayerComponent],
  template: `
    @if (activeEpisode() && videoPlayerProps()) {
      <app-video-player #videoPlayer [props]="videoPlayerProps()!" />
    }

    @if (!activeEpisode()) {
      <app-top-bar />
      <main class="p-8 max-w-7xl mx-auto">
        @if (loading()) {
          <p class="text-slate-400">Carregant episodis...</p>
        } @else if (playlist()) {
          <button
            (click)="router.navigate(['/'])"
            class="bg-transparent border-none text-slate-400 text-sm mb-4 cursor-pointer flex items-center gap-2 px-0 py-2 hover:text-slate-300 transition-colors"
          >
            ← Tornar a temporades
          </button>

          <div class="flex items-center gap-4 mb-2 flex-wrap">
            <h1 class="text-2xl font-bold m-0 text-white">
              {{ playlist()!.name }}
            </h1>

            @if (authService.isAuthenticated()) {
              <button
                (click)="handleToggleSeasonWatched()"
                [disabled]="seasonMarkLoading()"
                [title]="isSeasonFullyWatched() ? 'Marcar temporada com a no vista' : 'Marcar temporada com a vista'"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-medium transition-all"
                [class.bg-green-500]="isSeasonFullyWatched()"
                [class.border-green-500]="isSeasonFullyWatched()"
                [class.bg-slate-800]="!isSeasonFullyWatched()"
                [class.border-slate-600]="!isSeasonFullyWatched()"
                [class.opacity-60]="seasonMarkLoading()"
                [class.cursor-wait]="seasonMarkLoading()"
                [class.cursor-pointer]="!seasonMarkLoading()"
                style="border-width: 1px"
              >
                <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                {{ seasonMarkLoading() ? 'Processant...' : (isSeasonFullyWatched() ? 'Temporada vista' : 'Marcar temporada com a vista') }}
              </button>
            }
          </div>

          @if (playlist()!.description) {
            <p class="text-slate-400 mb-8 leading-relaxed">
              {{ playlist()!.description }}
            </p>
          }

          <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            @for (episode of playlist()!.videos; track episode.id; let idx = $index) {
              <button
                (click)="handlePlayEpisode(episode, idx)"
                class="bg-slate-700 rounded-xl p-0 flex flex-col text-left transition-all border-none cursor-pointer overflow-hidden relative hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div class="w-full aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
                  @if (authService.isAuthenticated()) {
                    <button
                      (click)="handleToggleWatched($event, episode)"
                      [title]="isEpisodeWatched(episode.id) ? 'Marcar com a no visualitzat' : 'Marcar com a visualitzat'"
                      class="absolute top-2 right-2 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-all z-[5] hover:scale-110"
                      [class.bg-green-500]="isEpisodeWatched(episode.id)"
                      [class.border-none]="isEpisodeWatched(episode.id)"
                      [class.bg-black/50]="!isEpisodeWatched(episode.id)"
                      [class.border-2]="!isEpisodeWatched(episode.id)"
                      [class.border-white/50]="!isEpisodeWatched(episode.id)"
                    >
                      <svg viewBox="0 0 24 24" class="w-4 h-4 fill-white">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </button>
                  }
                  
                  <svg viewBox="0 0 24 24" class="w-12 h-12 fill-white/80">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                </div>

                @if (getEpisodeProgressPercent(episode.id) > 0 && getEpisodeProgressPercent(episode.id) < 100) {
                  <div class="absolute bottom-0 left-0 w-full h-1 bg-black/30">
                    <div
                      class="h-full bg-blue-500 transition-all"
                      [style.width.%]="getEpisodeProgressPercent(episode.id)"
                    ></div>
                  </div>
                }

                <div class="p-4">
                  <span class="text-base font-semibold block text-white">
                    {{ episode.name }}
                  </span>
                </div>
              </button>
            }
          </div>
        }
      </main>
    }
  `,
  standalone: true
})
export class SeasonComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayerComponent?: VideoPlayerComponent;

  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly showsService = inject(ShowsService);
  private readonly progressService = inject(ProgressService);
  readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  readonly playlist = signal<Playlist | null>(null);
  readonly loading = signal(true);
  readonly watchProgress = signal<WatchProgress[]>([]);
  readonly seasonMarkLoading = signal(false);
  readonly activeEpisode = signal<ActiveEpisode | null>(null);
  readonly videoPlayerProps = signal<VideoPlayerProps | null>(null);

  private seasonId = 0;
  private pendingEpisodeId: number | null = null;
  private shouldAutoplay = false;

  readonly isSeasonFullyWatched = computed(() => {
    const pl = this.playlist();
    const videos = pl?.videos;
    if (!videos || videos.length === 0) return false;
    return videos.every(ep => this.getEpisodeProgress(ep.id)?.completed);
  });

  constructor() {
    // Watch for activeEpisode changes and update video player props
    effect(() => {
      const ep = this.activeEpisode();
      const pl = this.playlist();
      if (ep && pl) {
        this.videoPlayerProps.set({
          title: ep.title,
          url: ep.url,
          episodeId: ep.id,
          seasonId: this.seasonId,
          showId: pl.showId || 4,
          episodeName: ep.title,
          seasonName: pl.name,
          goBack: () => this.handleGoBack(),
          onNext: ep.index < (pl.videos?.length || 0) - 1 ? () => this.handleNext() : undefined,
          onPrevious: ep.index > 0 ? () => this.handlePrevious() : undefined
        });
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.seasonId = Number(params['seasonId']);
      this.loadPlaylist();
    });

    this.route.queryParams.subscribe(params => {
      const episodeId = params['episodeId'];
      const autoplay = params['autoplay'] === 'true';
      if (episodeId) {
        this.pendingEpisodeId = Number(episodeId);
        this.shouldAutoplay = autoplay;
        
        // Try autoplay if playlist already loaded
        if (autoplay && this.playlist() && !this.activeEpisode()) {
          this.checkAutoPlay(this.pendingEpisodeId);
        }
      }
    });
  }

  private loadPlaylist(): void {
    this.showsService.getPlaylist(this.seasonId).subscribe(playlist => {
      this.playlist.set(playlist);
      this.loading.set(false);
      this.loadProgress();
      
      // Check if we have a pending autoplay
      if (this.shouldAutoplay && this.pendingEpisodeId && !this.activeEpisode()) {
        this.checkAutoPlay(this.pendingEpisodeId);
      }
    });
  }

  private loadProgress(): void {
    if (!this.authService.isAuthenticated()) return;

    this.http.get<WatchProgress[]>(`${this.config.apiUrl}/progress`).subscribe({
      next: (progress) => {
        this.watchProgress.set(progress);
      },
      error: () => {
        this.watchProgress.set([]);
      }
    });
  }

  private checkAutoPlay(episodeId: number): void {
    const videos = this.playlist()?.videos || [];
    if (videos.length > 0) {
      const idx = videos.findIndex(e => e.id === episodeId);
      if (idx >= 0) {
        this.handlePlayEpisode(videos[idx], idx);
      }
    }
  }

  handlePlayEpisode(episode: Episode, index: number): void {
    this.activeEpisode.set({
      id: episode.id,
      title: episode.name,
      url: episode.url || '',
      index
    });
  }

  handleGoBack(): void {
    this.activeEpisode.set(null);
    this.router.navigate(['/season', this.seasonId]);
    this.loadProgress();
  }

  handleNext(): void {
    const ep = this.activeEpisode();
    const videos = this.playlist()?.videos || [];
    if (ep && ep.index < videos.length - 1) {
      const next = videos[ep.index + 1];
      this.activeEpisode.set({
        id: next.id,
        title: next.name,
        url: next.url || '',
        index: ep.index + 1
      });
    }
  }

  handlePrevious(): void {
    const ep = this.activeEpisode();
    const videos = this.playlist()?.videos || [];
    if (ep && ep.index > 0) {
      const prev = videos[ep.index - 1];
      this.activeEpisode.set({
        id: prev.id,
        title: prev.name,
        url: prev.url || '',
        index: ep.index - 1
      });
    }
  }

  getEpisodeProgress(episodeId: number): WatchProgress | undefined {
    return this.watchProgress().find(p => p.episodeId === episodeId);
  }

  isEpisodeWatched(episodeId: number): boolean {
    return this.getEpisodeProgress(episodeId)?.completed || false;
  }

  getEpisodeProgressPercent(episodeId: number): number {
    const p = this.getEpisodeProgress(episodeId);
    if (!p || p.duration <= 0) return 0;
    return Math.min(100, (p.currentTime / p.duration) * 100);
  }

  handleToggleWatched(event: Event, episode: Episode): void {
    event.stopPropagation();
    const current = this.getEpisodeProgress(episode.id);
    
    this.progressService.markCompleted({
      episodeId: episode.id,
      seasonId: this.seasonId,
      showId: this.playlist()?.showId || 4,
      episodeName: episode.name,
      seasonName: this.playlist()?.name,
      completed: !current?.completed
    }).subscribe(() => {
      this.loadProgress();
    });
  }

  handleToggleSeasonWatched(): void {
    const videos = this.playlist()?.videos;
    if (!videos || this.seasonMarkLoading()) return;
    
    this.seasonMarkLoading.set(true);
    const targetCompleted = !this.isSeasonFullyWatched();

    const requests = videos.map(ep =>
      this.progressService.markCompleted({
        episodeId: ep.id,
        seasonId: this.seasonId,
        showId: this.playlist()?.showId || 4,
        episodeName: ep.name,
        seasonName: this.playlist()?.name,
        completed: targetCompleted
      })
    );

    // Wait for all requests
    Promise.all(requests.map(r => r.toPromise())).then(() => {
      this.loadProgress();
      this.seasonMarkLoading.set(false);
    });
  }
}
