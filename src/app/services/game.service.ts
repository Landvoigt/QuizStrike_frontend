import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { RestService } from './rest.service';
import { ErrorService } from './error.service';
import { StorageService } from './storage.service';

import * as Interfaces from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private quizzesSubject = new BehaviorSubject<Interfaces.Quiz[]>([]);
  quizzes$: Observable<Interfaces.Quiz[]> = this.quizzesSubject.asObservable();

  private gamesSubject = new BehaviorSubject<Record<number, Interfaces.Game>>({});
  games$: Observable<Record<number, Interfaces.Game>> = this.gamesSubject.asObservable();

  constructor(
    private rest: RestService,
    private error: ErrorService,
    private storage: StorageService,
    private router: Router) {

    this.migrateLegacySession();
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

  /** Quiz by id from loaded list. */
  quiz$(quizId: number): Observable<Interfaces.Quiz | null> {
    return this.quizzes$.pipe(map(quizzes => quizzes.find(quiz => quiz.id === quizId) ?? null));
  }

  /** Joins quiz (token only for stored name), stores player + game. */
  join(quizId: number, name: string): Observable<Interfaces.Game> {
    const token = name === this.getPlayer(quizId) ? this.getToken(quizId) : null;
    return this.rest.getGame({ name, quizId }, token)
      .pipe(tap(game => this.setGame(quizId, name, game)));
  }

  /** Rejoins stored player; null if none or failed (409/404 forget player). */
  restore(quizId: number): Observable<Interfaces.Game | null> {
    const name = this.getPlayer(quizId);
    if (!name) return of(null);

    return this.join(quizId, name).pipe(
      catchError((err) => {
        this.onRestoreError(quizId, err);
        return of(null);
      })
    );
  }

  /** Restore error: 409 = name taken, 404 = player gone, 429 = rate limit. */
  private onRestoreError(quizId: number, err: any): void {
    if (err?.status === 409) {
      this.leave(quizId, { dropToken: true });
      this.error.handleError(this.error.NAME_TAKEN);
    } else if (err?.status === 429) {
      this.error.handleError(this.error.tooManyPlayers(err.error?.retry_after));
    } else if (err?.status === 404) {
      this.leave(quizId);
      this.error.handleError(err);
    } else {
      this.error.handleError(err);
    }
  }

  /** Stores token, player name and game for quiz. */
  private setGame(quizId: number, name: string, game: Interfaces.Game): void {
    this.setToken(quizId, game.token);
    this.setPlayer(quizId, name);
    this.gamesSubject.next({ ...this.gamesSubject.getValue(), [quizId]: game });
  }

  /** Loaded game for quiz, if any. */
  getGame(quizId: number): Interfaces.Game | null {
    return this.gamesSubject.getValue()[quizId] ?? null;
  }

  /** True if all questions answered. */
  isCompleted(game: Interfaces.Game | null | undefined): boolean {
    return !!game && (game.quiz_completed || game.answered_questions >= game.total_questions);
  }

  /** Id of started, unfinished quiz; 0 if none. */
  getRunningQuiz(): number {
    return this.storage.getNumber('QuizStrike_runningQuizId');
  }

  /** Marks quiz as running. */
  setRunningQuiz(quizId: number): void {
    this.storage.set('QuizStrike_runningQuizId', quizId.toString());
  }

  /** Clears running quiz. */
  clearRunningQuiz(): void {
    this.storage.remove('QuizStrike_runningQuizId');
  }

  /** Route guard: redirects to running game, else allows. */
  runningGameRedirect(): true | UrlTree {
    const quizId = this.getRunningQuiz();
    return quizId ? this.router.createUrlTree(['quiz', quizId, 'play']) : true;
  }

  /** Forgets player + game for quiz; keeps token unless `dropToken`. */
  leave(quizId: number, options: { dropToken?: boolean } = {}): void {
    if (options.dropToken) this.removeToken(quizId);
    if (this.getRunningQuiz() === quizId) this.clearRunningQuiz();
    this.storage.remove(this.playerKey(quizId));

    const games = { ...this.gamesSubject.getValue() };
    delete games[quizId];
    this.gamesSubject.next(games);
  }

  /** Stored player name for quiz. */
  getPlayer(quizId: number): string {
    return this.storage.getString(this.playerKey(quizId));
  }

  /** Saves player name for quiz. */
  private setPlayer(quizId: number, name: string): void {
    this.storage.set(this.playerKey(quizId), name);
  }

  /** Player token for quiz. */
  getToken(quizId: number | null | undefined): string | null {
    if (!quizId) return null;
    return this.storage.getString(this.tokenKey(quizId)) || null;
  }

  /** Saves player token for quiz. */
  private setToken(quizId: number, token: string | null | undefined): void {
    if (!token) return;
    this.storage.set(this.tokenKey(quizId), token);
  }

  /** Deletes player token for quiz. */
  private removeToken(quizId: number): void {
    this.storage.remove(this.tokenKey(quizId));
  }

  /** Moves old single-quiz player name to per-quiz key. */
  private migrateLegacySession(): void {
    const name = this.storage.getString('QuizStrike_player');
    if (!name) return;

    const quizId = this.getRunningQuiz();
    if (quizId) this.setPlayer(quizId, name);
    this.storage.remove('QuizStrike_player');
  }

  /** localStorage key for quiz player name. */
  private playerKey(quizId: number): string {
    return `QuizStrike_player_${quizId}`;
  }

  /** localStorage key for quiz token. */
  private tokenKey(quizId: number): string {
    return `QuizStrike_token_${quizId}`;
  }

}
