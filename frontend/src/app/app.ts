import {Component, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Header} from './shared/header/header';
import {ErrorBanner} from './shared/error-banner/error-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, ErrorBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('shop');
}
