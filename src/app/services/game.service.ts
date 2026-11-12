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

  /** Loads initial data. */
  initialize(): void {
    this.getQuizzes();
  }

  /** Fetches quizzes with questions into `quizzes$`. */
  private getQuizzes(): void {
    this.rest.getQuizzes().subscribe({
      next: (data) => {
        this.quizzesSubject.next(data.filter(quiz => quiz.question_count > 0));
      },
      error: (err) => this.error.handleError(err)
    });
  }

  /** Stores game + its token, emits on `game$`. */
  setGame(game: Interfaces.Game): void {
    this.setToken(game.quiz?.id, game.token);
    this.gameSubject.next(game);
  }

  /** Current game, if any. */
  getGame(): Interfaces.Game | null {
    return this.gameSubject.getValue();
  }

  /** Rejoins stored game after reload; 409/404 reset session. */
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
          this.resetSession({ dropToken: true });
          this.error.handleError(this.error.NAME_TAKEN);
        } else if (err?.status === 404) {
          this.resetSession();
          this.error.handleError(err);
        } else {
          this.error.handleError(err);
        }
        this.nav.menu();
      }
    });
  }

  /** Forgets running game; keeps token unless `dropToken`. */
  resetSession(options: { dropToken?: boolean } = {}): void {
    if (options.dropToken) {
      this.removeToken(this.getQuiz());
    }
    this.storage.remove('QuizStrike_player');
    this.storage.remove('QuizStrike_runningQuizId');
    this.gameSubject.next(null);
  }

  /** Stored player name. */
  getPlayer(): string {
    return this.storage.getString('QuizStrike_player');
  }

  /** Stored running quiz id. */
  getQuiz(): number {
    return this.storage.getNumber('QuizStrike_runningQuizId');
  }

  /** Player token for quiz (default: running quiz). */
  getToken(quizId: number | null | undefined = this.getQuiz()): string | null {
    if (!quizId) return null;
    return this.storage.getString(this.tokenKey(quizId)) || null;
  }

  /** Saves player token for quiz. */
  setToken(quizId: number | null | undefined, token: string | null | undefined): void {
    if (!quizId || !token) return;
    this.storage.set(this.tokenKey(quizId), token);
  }

  /** Deletes player token for quiz. */
  removeToken(quizId: number | null | undefined): void {
    if (!quizId) return;
    this.storage.remove(this.tokenKey(quizId));
  }

  /** localStorage key for quiz token. */
  private tokenKey(quizId: number): string {
    return `QuizStrike_token_${quizId}`;
  }

}
