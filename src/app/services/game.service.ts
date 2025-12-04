import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RestService } from './rest.service';
import { ErrorService } from './error.service';
import { NavigationService } from './navigation.service';

import * as Interfaces from '../interfaces';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private quizzesSubject = new BehaviorSubject<Interfaces.Quiz[]>([]);
  quizzes$: Observable<Interfaces.Quiz[]> = this.quizzesSubject.asObservable();

  private gameSubject = new BehaviorSubject<Interfaces.Game | null>(null);
  game$: Observable<Interfaces.Game | null> = this.gameSubject.asObservable();

  constructor(
    private rest: RestService,
    private error: ErrorService,
    private nav: NavigationService,
    private storage: StorageService) {

    this.initialize();
    this.restoreGame();
  }

  initialize(): void {
    this.getQuizzes();
  }

  private getQuizzes(): void {
    this.rest.getQuizzes().subscribe({
      next: (data) => {
        this.quizzesSubject.next(data);
      },
      error: (err) => this.error.handleError(err)
    });
  }

  setGame(game: Interfaces.Game): void {
    this.gameSubject.next(game);
  }

  getGame(): Interfaces.Game | null {
    return this.gameSubject.getValue();
  }

  restoreGame(): void {
    if (!this.getPlayer() || !this.getQuiz()) return;

    this.rest.getGame({ name: this.getPlayer(), quizId: this.getQuiz() }).subscribe({
      next: (game: Interfaces.Game) => {
        this.gameSubject.next(game);

        if (game.quiz_completed || (game.answered_questions ?? 0) > 0) {
          this.nav.game();
        } else {
          this.nav.menu();
        }
      },
      error: (err) => {
        this.error.handleError(err);
        this.nav.menu();
      }
    });
  }

  getPlayer(): string {
    return this.storage.getString('QuizStrike_player');
  }

  getQuiz(): number {
    return this.storage.getNumber('QuizStrike_runningQuizId');
  }

}
