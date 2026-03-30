import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth/auth-service';
import {inject} from '@angular/core';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  if (!auth.isAdmin()) {
    return router.createUrlTree(['/forbidden']);
  }

  return true;
};
