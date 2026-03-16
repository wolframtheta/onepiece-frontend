import { Component, inject, signal, effect, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';
import { ProgressService, WatchProgress } from '../../services/progress.service';

@Component({
  selector: 'app-continue-watching',
  imports: [RouterLink],
  template: `
    @if (authStore.isLoggedIn() && lastProgress()) {
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-4 text-white">
          Continua veient
        </h2>

        <a
          [routerLink]="['/season', lastProgress()!.seasonId]"
          [queryParams]="{episodeId: lastProgress()!.episodeId, autoplay: 'true'}"
          class="inline-flex flex-col w-80 bg-slate-800 rounded-xl overflow-hidden transition-transform hover:-translate-y-1 border border-slate-700"
        >
          <div class="w-full aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
            <!-- Play icon -->
            <svg
              viewBox="0 0 24 24"
              class="w-12 h-12 fill-white/60"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>

            <!-- Completed badge -->
            @if (isCompleted()) {
              <div class="absolute top-2 right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
                <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            }

            <!-- Progress bar -->
            @if (!isCompleted()) {
              <div class="absolute bottom-0 left-0 w-full h-1 bg-black/40">
                <div
                  class="h-full bg-blue-500"
                  [style.width.%]="progressPercent()"
                ></div>
              </div>
            }
          </div>

          <div class="p-4 flex flex-col gap-1">
            <span class="text-sm font-semibold text-white">
              {{ lastProgress()!.episodeName || 'Episodi ' + lastProgress()!.episodeId }}
            </span>
            <span class="text-xs text-slate-400">
              {{ lastProgress()!.seasonName || 'Temporada ' + lastProgress()!.seasonId }}
            </span>
            <span
              class="text-xs font-medium mt-1"
              [class.text-green-500]="isCompleted()"
              [class.text-blue-500]="!isCompleted()"
            >
              {{ isCompleted() ? 'Visualitzat ✓' : 'Reprendre (' + Math.round(progressPercent()) + '%)' }}
            </span>
          </div>
        </a>
      </section>
    }
  `,
  standalone: true
})
export class ContinueWatchingComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly progressService = inject(ProgressService);
  private readonly platformId = inject(PLATFORM_ID);
  
  readonly lastProgress = signal<WatchProgress | null>(null);
  readonly Math = Math;

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId) && this.authStore.isLoggedIn()) {
        this.progressService.getLastProgress().subscribe(progress => {
          this.lastProgress.set(progress);
        });
      }
    });
  }

  ngOnInit(): void {
    // Effect now runs in constructor
  }

  progressPercent(): number {
    const progress = this.lastProgress();
    if (!progress || progress.duration <= 0) return 0;
    return Math.min(100, (progress.currentTime / progress.duration) * 100);
  }

  isCompleted(): boolean {
    return this.lastProgress()?.completed ?? false;
  }
}
