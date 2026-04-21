import {inject} from '@angular/core';
import {HttpInterceptorFn} from '@angular/common/http';
import {AuthService} from '../services/auth/auth-service';


export const AuthInterceptor: HttpInterceptorFn = (req, next) =>{

  const authService = inject(AuthService);
  const token = authService.getToken();

  // Attach auth header when a token is available.
  if(token) {
    const authReq = req.clone({
      setHeaders: {Authorization: token},
    });
    return next(authReq);
  }

  // Forward request unchanged for public endpoints / unauthenticated users.
  return next(req);
}
