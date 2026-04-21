import {Routes} from '@angular/router';
import {adminGuard} from '../../core/guard/admin-guard';
import {AdminLogin} from './admin-login/admin-login';
import {AdminPage} from './admin-page/admin-page';


export const ADMIN_ROUTES: Routes = [
  {
    // Public admin login route.
    path: 'login',
    component: AdminLogin,
  },
  {
    // Protected admin area.
    path: '',
    canActivate: [adminGuard],
    children: [
      // Default child route for /admin.
      { path: '', redirectTo: 'admin-page', pathMatch: 'full' },
      { path: 'admin-page', component: AdminPage },
    ],
  },
];
