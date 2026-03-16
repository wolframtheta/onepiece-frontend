import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-900">
      <div class="w-full max-w-md bg-slate-700 rounded-xl overflow-hidden">
        <!-- Tabs -->
        <div class="flex">
          <button
            (click)="tab.set('login')"
            class="flex-1 px-6 py-3 text-sm font-medium transition-colors rounded-t-lg"
            [class.bg-blue-600]="tab() === 'login'"
            [class.bg-slate-600]="tab() !== 'login'"
            [class.font-semibold]="tab() === 'login'"
          >
            Iniciar sessió
          </button>
          <button
            (click)="tab.set('register')"
            class="flex-1 px-6 py-3 text-sm font-medium transition-colors rounded-t-lg"
            [class.bg-blue-600]="tab() === 'register'"
            [class.bg-slate-600]="tab() !== 'register'"
            [class.font-semibold]="tab() === 'register'"
          >
            Registrar-se
          </button>
        </div>

        <!-- Form -->
        <form
          [formGroup]="loginForm"
          (ngSubmit)="handleSubmit()"
          class="p-6 flex flex-col gap-4"
        >
          @if (error()) {
            <div class="px-3 py-2 bg-red-500/20 rounded-lg text-red-300 text-sm">
              {{ error() }}
            </div>
          }

          <div>
            <label class="block mb-1 text-sm text-slate-400">
              Email
            </label>
            <input
              type="email"
              formControlName="email"
              required
              class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-50 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          @if (tab() === 'register') {
            <div>
              <label class="block mb-1 text-sm text-slate-400">
                Nom d'usuari
              </label>
              <input
                type="text"
                formControlName="username"
                required
                class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-50 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          }

          <div>
            <label class="block mb-1 text-sm text-slate-400">
              Contrasenya
            </label>
            <input
              type="password"
              formControlName="password"
              required
              class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-50 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="px-3 py-2 rounded-lg text-slate-50 font-semibold text-sm mt-2 transition-colors disabled:opacity-50"
            [class.bg-blue-600]="!loading()"
            [class.hover:bg-blue-500]="!loading()"
            [class.bg-slate-600]="loading()"
          >
            {{ loading() ? 'Carregant...' : (tab() === 'login' ? 'Entrar' : 'Crear compte') }}
          </button>
        </form>
      </div>
    </div>
  `,
  standalone: true
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly tab = signal<'login' | 'register'>('login');
  readonly error = signal('');
  readonly loading = signal(false);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: [''],
    password: ['', Validators.required]
  });

  handleSubmit(): void {
    if (this.loginForm.invalid) return;

    this.error.set('');
    this.loading.set(true);

    const { email, username, password } = this.loginForm.value;

    const request$ = this.tab() === 'login'
      ? this.authService.login(email, password)
      : this.authService.register(email, username, password);

    request$.subscribe({
      next: (data) => {
        this.authStore.initAuth(data.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error?.message || "Error d'autenticació");
        this.loading.set(false);
      }
    });
  }
}
