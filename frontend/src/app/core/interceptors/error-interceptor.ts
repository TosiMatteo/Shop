import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {ErrorService} from '../services/error-service';
import {Router} from '@angular/router';
import {catchError, EMPTY, throwError} from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = err.error?.error?.message ?? 'An unexpected error occured';
      const details = err.error?.error?.details ?? [];

      switch(err.status){
        case 400:
          errorService.setError({statusCode:400, message, details});
          break;

        case 401:
          errorService.setError({statusCode:401, details, message});
          router.navigate(['/login']);
          break;

        case 403:
          errorService.setError({statusCode: 403, message });
          router.navigate(['/forbidden']);
          break;

        case 404:
          errorService.setError({statusCode: 404, message });
          break;

        case 422:
          errorService.setError({statusCode: 422, message, details });
          break;

        case 500:
          errorService.setError({statusCode: 500, message });
          break;

        default:
          errorService.setError({statusCode: err.status, message });
      }
      return EMPTY;
    })
  );
}
