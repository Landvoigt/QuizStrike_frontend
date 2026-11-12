import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';

import { NavigationService } from '../services/navigation.service';
import { RestService } from '../services/rest.service';
import { GameService } from '../services/game.service';
import { ErrorService } from '../services/error.service';
import { StorageService } from '../services/storage.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-menu',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './menu.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu.scss',
})
export class MenuComponent implements OnInit {
  overlayVisible: boolean = false;
  showInput: boolean = false;

  game: Interfaces.Game | null = null;
  selectedQuiz: Interfaces.Quiz | null = null;

  playerName: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private rest: RestService,
    private error: ErrorService,
    public nav: NavigationService,
    public gameService: GameService,
    private storage: StorageService
  ) { }

  /** Restores running game, if any. */
  ngOnInit(): void {
    this.tryRestorePlayer();
  }

  /** Prefills name, listens for restored game. */
  private tryRestorePlayer(): void {
    if (!this.getPlayer() || !this.getQuiz()) return;
    this.playerName = this.getPlayer();
    this.selectedQuiz = null;

    this.gameService.game$.subscribe((game) => this.onGameLoaded(game));
  }

  /** Stores restored game + its quiz. */
  onGameLoaded(game: Interfaces.Game | null): void {
    if (!game) return;

    this.game = game;

    if (!this.selectedQuiz && game.quiz) {
      this.selectedQuiz = game.quiz;
    }

    this.cdr.detectChanges();
  }

  /** Selects quiz, shows name input. */
  selectQuiz(quiz: Interfaces.Quiz): void {
    this.selectedQuiz = quiz;
    this.showInput = true;
  }

  /** Joins selected quiz with entered name (+ stored token). */
  register(nameInput: NgModel): void {
    if (!nameInput.valid || !this.playerName.trim()) return;

    const quizId = this.selectedQuiz?.id ?? null;
    const token = this.gameService.getToken(quizId);

    this.rest.getGame({ name: this.playerName.trim(), quizId }, token)
      .subscribe({
        next: (data) => this.onRegistrationSuccess(data),
        error: (err) => this.onRegistrationError(err),
      });
  }

  /** Opens game, stays in menu if quiz completed. */
  play(): void {
    if (this.game?.quiz_completed) {
      this.nav.menu();
      return;
    }

    this.nav.game();
  }

  /** Stores game; error if all questions answered, else saves player. */
  onRegistrationSuccess(game: Interfaces.Game): void {
    this.gameService.setGame(game);
    this.game = game;
    this.showInput = false;

    if (this.game.answered_questions === this.game.total_questions) {
      this.onRegistrationError(this.error.GAME_FINISHED);
    } else {
      this.cdr.detectChanges();
      this.setValues();
    }
  }

  /** Shows error (409 = name taken), clears name. */
  onRegistrationError(err: any): void {
    if (err?.status === 409) {
      this.error.handleError(this.error.NAME_TAKEN);
    } else {
      this.error.handleError(err);
    }
    this.playerName = '';
    this.cdr.detectChanges();
  }

  /** Stored player name. */
  getPlayer(): string {
    return this.storage.getString('QuizStrike_player');
  }

  /** Stored running quiz id. */
  getQuiz(): number {
    return this.storage.getNumber('QuizStrike_runningQuizId');
  }

  /** Saves player name + quiz id. */
  setValues(): void {
    this.storage.set('QuizStrike_player', this.playerName.trim());
    this.storage.set('QuizStrike_runningQuizId', this.game?.quiz.id.toString() ?? '');
  }

}