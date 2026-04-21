import {Injectable, signal} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';
import {filter} from 'rxjs';

export interface AppError {
  message: string;
  statusCode: number;
  details?: string[];
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  // Shared reactive error state consumed by components/layouts.
  readonly error = signal<AppError | null>(null);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
      // Drop stale error messages when the user changes route.
    ).subscribe(() => this.clearError());
  }

  // Set the current application error.
  setError(error: AppError): void { this.error.set(error); }
  // Clear the current error state.
  clearError(): void { this.error.set(null); }
}
