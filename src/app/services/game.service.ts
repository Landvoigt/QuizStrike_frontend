import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RestService } from './rest.service';
import { ErrorService } from './error.service';
import { NavigationService } from './navigation.service';
import { StorageService } from './storage.service';

import * as Interfaces from '../interfaces';

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
    this.setToken(game.quiz?.id, game.token);
    this.gameSubject.next(game);
  }

  getGame(): Interfaces.Game | null {
    return this.gameSubject.getValue();
  }

  restoreGame(): void {
    const quizId = this.getQuiz();
    if (!this.getPlayer() || !quizId) return;

    this.rest.getGame({ name: this.getPlayer(), quizId }, this.getToken()).subscribe({
      next: (game: Interfaces.Game) => {
        this.setGame(game);

        if (game.quiz_completed || (game.answered_questions ?? 0) > 0) {
          this.nav.game();
        } else {
          this.nav.menu();
        }
      },
      error: (err) => {
        if (err?.status === 409) {
          // Name belongs to someone else (or our token got lost) -> pick a new name.
          this.resetSession({ dropToken: true });
          this.error.handleError(this.error.NAME_TAKEN);
        } else if (err?.status === 404) {
          // Quiz no longer exists / inactive.
          this.resetSession();
          this.error.handleError(err);
        } else {
          this.error.handleError(err);
        }
        this.nav.menu();
      }
    });
  }

  /**
   * Forget the running game (player name + quiz). Tokens are kept per quiz so the
   * player can rejoin with the same name later, unless `dropToken` is set.
   */
  resetSession(options: { dropToken?: boolean } = {}): void {
    if (options.dropToken) {
      this.removeToken(this.getQuiz());
    }
    this.storage.remove('QuizStrike_player');
    this.storage.remove('QuizStrike_runningQuizId');
    this.gameSubject.next(null);
  }

  getPlayer(): string {
    return this.storage.getString('QuizStrike_player');
  }

  getQuiz(): number {
    return this.storage.getNumber('QuizStrike_runningQuizId');
  }

  /** Player token for the given quiz (defaults to the running quiz). */
  getToken(quizId: number | null | undefined = this.getQuiz()): string | null {
    if (!quizId) return null;
    return this.storage.getString(this.tokenKey(quizId)) || null;
  }

  setToken(quizId: number | null | undefined, token: string | null | undefined): void {
    if (!quizId || !token) return;
    this.storage.set(this.tokenKey(quizId), token);
  }

  removeToken(quizId: number | null | undefined): void {
    if (!quizId) return;
    this.storage.remove(this.tokenKey(quizId));
  }

  private tokenKey(quizId: number): string {
    return `QuizStrike_token_${quizId}`;
  }

}
