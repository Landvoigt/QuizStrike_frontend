import { Component } from '@angular/core';
import { NavigationService } from '../services/navigation.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {

  constructor(public navigationService: NavigationService) { }
  
}
