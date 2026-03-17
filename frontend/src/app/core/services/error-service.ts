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
  readonly error = signal<AppError | null>(null);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => this.clearError());
  }

  setError(error: AppError): void { this.error.set(error); }
  clearError(): void { this.error.set(null); }
}
