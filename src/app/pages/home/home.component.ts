import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { ContinueWatchingComponent } from '../../components/continue-watching/continue-watching.component';
import { ShowsService, Show, Season } from '../../services/shows.service';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../stores/auth.store';
import { APP_CONFIG } from '../../config';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TopBarComponent, ContinueWatchingComponent],
  template: `
    <div class="min-h-screen bg-slate-900">
      <app-top-bar />
      
      <!-- Hero Banner -->
      @if (show()) {
        <div
          class="relative w-full h-96 flex items-end p-8"
          [style.background]="getHeroBackground()"
        >
          <div class="max-w-7xl w-full mx-auto">
            <h1 class="text-5xl font-bold mb-2 text-white drop-shadow-lg">
              {{ show()!.name || 'One Piece en Català' }}
            </h1>
            @if (show()!.description) {
              <p class="text-slate-200 leading-relaxed max-w-3xl text-lg drop-shadow-md">
                {{ show()!.description }}
              </p>
            }
          </div>
        </div>
      }

      <main class="p-8 max-w-7xl mx-auto">
        <app-continue-watching />

        <section class="mt-12">
          <h2 class="text-3xl font-semibold mb-6 text-white">
            Totes les Temporades
          </h2>

          @if (loading()) {
            <p class="text-slate-400">Carregant temporades...</p>
          } @else if (seasons().length > 0) {
            <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
              @for (season of seasons(); track season.id) {
                <a
                  [routerLink]="['/season', season.id]"
                  class="bg-slate-800 rounded-xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-700 hover:border-slate-600"
                >
                  <div
                    class="w-full aspect-video flex items-center justify-center relative bg-gradient-to-br from-indigo-500 to-purple-600"
                    [style.background-image]="season.cover ? 'url(' + season.cover + ')' : ''"
                    [style.background-size]="'cover'"
                    [style.background-position]="'center'"
                  >
                    @if (!season.cover) {
                      <svg
                        viewBox="0 0 24 24"
                        class="w-16 h-16 fill-white/60"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                      </svg>
                    }
                  </div>
                  <div class="p-5">
                    <span class="text-base font-semibold block leading-snug text-white">
                      {{ season.name }}
                    </span>
                  </div>
                </a>
              }
            </div>
          }
        </section>
      </main>
    </div>
  `,
  standalone: true
})
export class HomeComponent implements OnInit {
  private readonly showsService = inject(ShowsService);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly config = inject(APP_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  readonly show = signal<Show | null>(null);
  readonly seasons = signal<Season[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    // Load show and seasons
    this.showsService.getShow(this.config.currentShow.id).subscribe(show => {
      this.show.set(show);
    });

    this.showsService.getSeasons(this.config.currentShow.id).subscribe(seasons => {
      this.seasons.set(seasons);
      this.loading.set(false);
    });

    // Try to fetch profile if authenticated
    if (isPlatformBrowser(this.platformId) && this.authService.isAuthenticated()) {
      this.authService.fetchProfile().subscribe({
        next: (profile) => {
          this.authStore.initAuth(profile);
        },
        error: () => {
          // Token invalid, ignore
        }
      });
    }
  }

  getHeroBackground(): string {
    const show = this.show();
    if (show?.cover) {
      return `linear-gradient(to bottom, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.95)), url(${show.cover})`;
    }
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
}
