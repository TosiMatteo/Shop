import {Injectable, signal} from '@angular/core';

export interface AppError {
  message: string;
  statusCode: number;
  details?: string[];
}

@Injectable(
  {providedIn: 'root'}
)
export class ErrorService {
  readonly error = signal<AppError | null>(null);

  setError(error: AppError): void {
    this.error.set(error);
  }

  clearError(): void {
    this.error.set(null);
  }
}
