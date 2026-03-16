import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-top-bar',
  imports: [RouterLink],
  template: `
    <header class="flex items-center justify-between px-8 py-4 bg-slate-800 border-b border-slate-700">
      <a routerLink="/" class="text-2xl font-bold text-white hover:text-slate-200">
        One Piece Català
      </a>

      <div class="flex gap-4 items-center">
        @if (authStore.isLoggedIn()) {
          <span class="text-sm text-slate-400">
            {{ authStore.user()?.username }}
          </span>
          <button
            (click)="logout()"
            class="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-slate-50 text-sm font-medium transition-colors"
          >
            Sortir
          </button>
        } @else {
          <a
            routerLink="/login"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Iniciar sessió
          </a>
        }
      </div>
    </header>
  `,
  standalone: true
})
export class TopBarComponent {
  readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
