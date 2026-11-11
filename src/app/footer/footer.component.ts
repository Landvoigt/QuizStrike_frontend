import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-footer-component',
  imports: [],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.component.scss',
})
export class FooterComponent {

  constructor(public nav: NavigationService) { }

  privacy(): void {
    if (this.nav.activePage === 'game') return;
    this.nav.privacy();
  }
}
