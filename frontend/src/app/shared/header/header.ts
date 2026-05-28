import {Component, DestroyRef, OnInit, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {Router, RouterLink} from '@angular/router';
import {AuthService, Customer} from '../../core/services/auth/auth-service';
import {CartIconComponent} from '../cart-icon';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    RouterLink,
    CartIconComponent,
    NgOptimizedImage
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  private router = inject(Router)
  private authService = inject(AuthService)
  private destroyRef = inject(DestroyRef)

  customerName = '';

  ngOnInit(): void {
    this.loadCustomerName();

    this.authService.loginEvent$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadCustomerName());

    this.authService.logoutEvent$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.customerName = '');
  }

  // Template helper for authenticated-only actions/menu items.
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // Template helper for admin-specific navigation/menu items.
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  private loadCustomerName(): void {
    if (!this.isAuthenticated || this.isAdmin) {
      this.customerName = '';
      return;
    }

    this.authService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: { user?: Customer }) => {
          this.customerName = response.user?.first_name ?? '';
        },
        error: () => this.customerName = '',
      });
  }

  manageSession(): void {
    if (this.isAuthenticated) {
      // End session server-side, then route to public entry point.
      this.authService.logout().subscribe({
        next: () => this.router.navigate(['/products']),
        error: () => this.router.navigate(['/login']),
      })
    } else {
      // No active session: go to login page.
      this.router.navigate(['/login']);
    }
  }

  orders(): void {
    // Orders page is available only for authenticated users.
    if (this.isAuthenticated) {
      this.router.navigate(['/orders'])
    }
  }

}
