import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-privacy',
  imports: [CommonModule, RouterModule],
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class PrivacyComponent {

  constructor(public nav: NavigationService) { }

}
