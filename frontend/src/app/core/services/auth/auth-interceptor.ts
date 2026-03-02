import {inject} from '@angular/core';
import {HttpInterceptorFn} from '@angular/common/http';
import {AuthService} from './auth-service';


export const AuthInterceptor: HttpInterceptorFn = (req, next) =>{

  const authService = inject(AuthService);
  const token = authService.getToken();

  if(token) {
    const authReq = req.clone({
      setHeaders: {Authorization: token},
    });
    return next(authReq);
  }
  return next(req);
}
