import { Component } from '@angular/core';
import { NavigationService } from '../services/navigation.service';
import { Overlay } from '../overlay/overlay';

@Component({
  selector: 'app-menu',
  imports: [Overlay],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class MenuComponent {
  overlayVisible: boolean = false;

  constructor(public navigationService: NavigationService) { }

  play() {
    this.overlayVisible = true;
    setTimeout(() => {
      this.navigationService.game();
    }, 4000);
  }

}
