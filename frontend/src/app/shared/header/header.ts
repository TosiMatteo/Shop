import {Component, inject} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/auth/auth-service';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    RouterLink
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private router = inject(Router)
  private authService = inject(AuthService)

  protected goToCheckout() {
    this.router.navigate(['/checkout'])
  }

  protected goToLogout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/api/products']),
      error: () => this.router.navigate(['/login']),
    })
  }
}
