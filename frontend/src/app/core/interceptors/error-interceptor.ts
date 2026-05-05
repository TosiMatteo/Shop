import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {ErrorService} from '../services/error-service';
import {Router} from '@angular/router';
import {catchError, EMPTY, retry, throwError, timer} from 'rxjs';
import {AuthService} from '../services/auth/auth-service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(retry({
    // Retry failed requests up to 3 times with a 2-second delay between retries for no HTTP response received.
      count: 3,
      delay: (err: HttpErrorResponse, retryCount) => {
        if (err.status === 0 && req.method == 'GET') {
          return timer(retryCount * 2000);
        }
        throw err;
      }
    })
    ,catchError((err: HttpErrorResponse) => {
      // Normalize backend payload shape and keep a safe fallback message.
      const message = err.error?.error?.message ?? 'An unexpected error occurred';
      const details = err.error?.error?.details ?? [];

      switch(err.status){
        case 0:
          // Network/server unreachable (no HTTP response received).
          errorService.setError({statusCode: 0, message: 'server not available'});
          break;

        case 400:
          errorService.setError({statusCode:400, message, details});
          break;

        case 401: {
          // Keep login failures available to the caller (e.g. login form) instead of redirecting.
          const isAuthCall = req.url.includes('/sign_in');
          let message = '';
          if(err.error?.error?.message){
            message = err.error.error.message;
          }else if(typeof err.error?.error === 'string') {
            message = err.error.error;
          }
          else{
            message = 'bad credentials'
          }

          if (isAuthCall) {
            errorService.setError({ statusCode: 401, message, details });
            return throwError(() => err);
          }

          // For expired/invalid sessions, clear local auth state and send user to the right login page.
          const redirectUrl = authService.isAdmin() ? '/admin/login' : '/login';
          errorService.setError({ statusCode: 401, details, message });
          authService.clearSession();
          router.navigate([redirectUrl]);
          break;
        }

        case 403: {
          errorService.setError({ statusCode: 403, message });
          // In user context, route to forbidden page; admin area can handle this in-place.
          const isAdminContext = authService.isAdmin();
          if (!isAdminContext) {
            router.navigate(['/forbidden']);
          }
          break;
        }

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
};
