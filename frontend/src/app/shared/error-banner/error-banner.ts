import {Component, inject} from '@angular/core';
import {ErrorService} from '../../core/services/error-service';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-error-banner',
  imports: [
    MatIcon,
    MatIconButton
  ],
  templateUrl: './error-banner.html',
  styleUrl: './error-banner.scss',
})
export class ErrorBanner {
  protected errorService = inject(ErrorService);
  protected error = this.errorService.error;
}
