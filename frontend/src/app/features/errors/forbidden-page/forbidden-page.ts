import { Component } from '@angular/core';
import {MatCard, MatCardActions, MatCardContent} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  imports: [
    MatCard,
    MatCardContent,
    MatIcon,
    MatCardActions,
    MatButton,
    RouterLink
  ],
  templateUrl: './forbidden-page.html',
  styleUrl: './forbidden-page.scss',
})
export class ForbiddenPage {

}
