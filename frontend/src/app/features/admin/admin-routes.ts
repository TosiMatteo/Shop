import {Routes} from '@angular/router';
import {adminGuard} from '../../core/guard/admin-guard';
import {AdminLogin} from './admin-login/admin-login';
import {AdminPage} from './admin-page/admin-page';


export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    component: AdminLogin,
  },
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'admin-page', pathMatch: 'full' },
      { path: 'admin-page', component: AdminPage },
    ],
  },
];
