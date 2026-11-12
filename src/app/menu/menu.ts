import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { NavigationService } from '../services/navigation.service';
import { RestService } from '../services/rest.service';
import { GameService } from '../services/game.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-menu',
  imports: [AsyncPipe],
  templateUrl: './menu.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu.scss',
})
export class MenuComponent {

  constructor(
    private rest: RestService,
    public nav: NavigationService,
    public gameService: GameService
  ) { }

  /** CSS `background-image` value for quiz. */
  background(quiz: Interfaces.Quiz): string {
    return quiz.image ? `url(${this.rest.getBaseUrl() + quiz.image})` : 'none';
  }

}
