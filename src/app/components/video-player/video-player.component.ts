import { Component, inject, signal, input, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProgressService, IntroConfig } from '../../services/progress.service';
import { AuthService } from '../../services/auth.service';
import { APP_CONFIG } from '../../config';

export interface VideoPlayerProps {
  title: string;
  url: string;
  episodeId: number;
  seasonId: number;
  showId: number;
  episodeName?: string;
  seasonName?: string;
  goBack: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

@Component({
  selector: 'app-video-player',
  template: `
    <div class="fixed inset-0 bg-black z-50 flex flex-col">
      <!-- Top bar -->
      <div class="flex items-center justify-between px-4 py-3 bg-black/70 absolute top-0 left-0 right-0 z-10">
        <div class="flex gap-3 items-center">
          <button
            (click)="props().goBack()"
            class="text-slate-50 bg-transparent text-xl px-2 py-1 hover:text-slate-200"
          >
            ← Tornar
          </button>
          <span class="text-slate-200 text-sm font-medium">
            {{ props().title }}
          </span>
        </div>

        <div class="flex gap-2">
          @if (props().onPrevious) {
            <button
              (click)="props().onPrevious!()"
              class="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-slate-50 text-xs transition-colors"
            >
              ⏮ Anterior
            </button>
          }
          @if (props().onNext) {
            <button
              (click)="handleNextClick()"
              class="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-slate-50 text-xs transition-colors"
            >
              Següent ⏭
            </button>
          }
        </div>
      </div>

      <!-- Video -->
      <video
        #videoEl
        [src]="props().url"
        controls
        autoplay
        (timeupdate)="handleTimeUpdate()"
        (ended)="handleEnded()"
        (pause)="doSaveProgress()"
        class="w-full h-full object-contain"
      ></video>

      <!-- Skip intro button -->
      @if (showSkip()) {
        <button
          (click)="skipIntro()"
          class="absolute bottom-20 right-8 px-6 py-3 bg-blue-600/90 hover:bg-blue-500/90 rounded-lg text-white text-sm font-semibold z-20 backdrop-blur transition-colors"
        >
          Saltar intro ⏩
        </button>
      }
    </div>
  `,
  standalone: true
})
export class VideoPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  // Use input signal instead of direct property assignment
  props = input.required<VideoPlayerProps>();

  private readonly progressService = inject(ProgressService);
  private readonly authService = inject(AuthService);
  private readonly config = inject(APP_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  
  readonly showSkip = signal(false);
  private introConfig: IntroConfig | null = null;
  private visibilityHandler?: () => void;
  private beforeUnloadHandler?: () => void;
  private lastLoadedEpisodeId: number | null = null;

  constructor() {
    // Watch for props changes to reload progress
    effect(() => {
      const currentProps = this.props();
      if (currentProps && this.videoEl) {
        this.loadEpisodeProgress();
      }
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Load intro config
    if (this.authService.isAuthenticated()) {
      this.progressService.getIntroConfig().subscribe(config => {
        this.introConfig = config;
      });
    }

    // Setup visibility/beforeunload handlers
    this.visibilityHandler = () => {
      if (document.hidden) this.keepaliveSaveProgress();
    };
    this.beforeUnloadHandler = () => this.keepaliveSaveProgress();

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Load progress after view is initialized
    this.loadEpisodeProgress();
  }

  loadEpisodeProgress(): void {
    const currentProps = this.props();
    if (!currentProps || !this.authService.isAuthenticated() || !this.videoEl) return;
    
    const episodeId = currentProps.episodeId;
    if (this.lastLoadedEpisodeId === episodeId) return;
    
    this.lastLoadedEpisodeId = episodeId;
    
    this.progressService.getEpisodeProgress(episodeId).subscribe(progress => {
      if (progress && progress.currentTime > 0 && !progress.completed && this.videoEl) {
        this.videoEl.nativeElement.currentTime = progress.currentTime;
      }
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.doSaveProgress();
    
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  private getIntroTiming() {
    const currentProps = this.props();
    if (!this.introConfig || !currentProps) return null;
    return this.introConfig.episodes[String(currentProps.episodeId)] ?? this.introConfig.default;
  }

  handleTimeUpdate(): void {
    const timing = this.getIntroTiming();
    if (timing && this.videoEl) {
      const t = this.videoEl.nativeElement.currentTime;
      this.showSkip.set(t >= timing.start && t < timing.end);
    }
  }

  skipIntro(): void {
    const timing = this.getIntroTiming();
    if (timing && this.videoEl) {
      this.videoEl.nativeElement.currentTime = timing.end;
      this.showSkip.set(false);
    }
  }

  doSaveProgress(): void {
    const currentProps = this.props();
    if (!this.authService.isAuthenticated() || !this.videoEl || !currentProps) return;
    
    this.progressService.saveProgress({
      episodeId: currentProps.episodeId,
      seasonId: currentProps.seasonId,
      showId: currentProps.showId,
      episodeName: currentProps.episodeName,
      seasonName: currentProps.seasonName,
      currentTime: this.videoEl.nativeElement.currentTime,
      duration: this.videoEl.nativeElement.duration || 0,
    }).subscribe();
  }

  private keepaliveSaveProgress(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const currentProps = this.props();
    if (!this.authService.isAuthenticated() || !this.videoEl || !currentProps) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetch(`${this.config.apiUrl}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        episodeId: currentProps.episodeId,
        seasonId: currentProps.seasonId,
        showId: currentProps.showId,
        episodeName: currentProps.episodeName,
        seasonName: currentProps.seasonName,
        currentTime: this.videoEl.nativeElement.currentTime,
        duration: this.videoEl.nativeElement.duration || 0,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  private markCurrentCompleted(): void {
    const currentProps = this.props();
    if (!this.authService.isAuthenticated() || !currentProps) return;
    
    this.progressService.markCompleted({
      episodeId: currentProps.episodeId,
      seasonId: currentProps.seasonId,
      showId: currentProps.showId,
      episodeName: currentProps.episodeName,
      seasonName: currentProps.seasonName,
      completed: true,
    }).subscribe();
  }

  handleEnded(): void {
    this.markCurrentCompleted();
    const currentProps = this.props();
    if (currentProps?.onNext) {
      currentProps.onNext();
    }
  }

  handleNextClick(): void {
    this.markCurrentCompleted();
    const currentProps = this.props();
    if (currentProps?.onNext) {
      currentProps.onNext();
    }
  }
}
