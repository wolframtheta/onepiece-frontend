import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly _user = signal<User | null>(null);
  private readonly _isLoggedIn = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  initAuth(user: User): void {
    this._user.set(user);
    this._isLoggedIn.set(true);
  }

  clearAuth(): void {
    this._user.set(null);
    this._isLoggedIn.set(false);
  }
}
