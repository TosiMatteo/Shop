import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth/auth-service';
import {inject} from '@angular/core';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Unauthenticated users must log in through the admin login route.
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  // Authenticated but not authorized as admin.
  if (!auth.isAdmin()) {
    return router.createUrlTree(['/forbidden']);
  }

  // User is authenticated and has admin privileges.
  return true;
};
