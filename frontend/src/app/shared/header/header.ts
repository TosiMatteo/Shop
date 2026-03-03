import {Component, inject} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/auth/auth-service';
import {CartIconComponent} from '../cart-icon';

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
    CartIconComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private router = inject(Router)
  private authService = inject(AuthService)

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  protected goToCart() {
    this.router.navigate(['/cart'])
  }

  manageSession(): void {
    if (this.isAuthenticated) {
      this.authService.logout().subscribe({
        next: () => this.router.navigate(['/api/products']),
        error: () => this.router.navigate(['/login']),
      })
    } else {
      // Porta al login mantenendo il redirect verso checkout
      this.router.navigate(['/login']);
    }
  }
}
