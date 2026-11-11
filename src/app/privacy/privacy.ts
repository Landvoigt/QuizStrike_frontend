import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-privacy',
  imports: [RouterModule],
  templateUrl: './privacy.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './privacy.scss',
})
export class PrivacyComponent {

  constructor(public nav: NavigationService) { }

}
