import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../services/navigation.service';
import { RestService } from '../services/rest.service';
import { GameService } from '../services/game.service';
import { ErrorService } from '../services/error.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-menu',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './menu.html',
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
    public gameService: GameService
  ) { }

  ngOnInit(): void {
    this.tryRestorePlayer();
  }

  private tryRestorePlayer(): void {
    const storedName = localStorage.getItem('QuizStrike_player');
    const storedQuizId = localStorage.getItem('QuizStrike_runningQuizId');

    if (!storedName || !storedQuizId) return;
    this.playerName = storedName;
    this.selectedQuiz = null;

    this.gameService.game$.subscribe((game) => this.onGameLoaded(game));
  }

  onGameLoaded(game: Interfaces.Game | null): void {
    if (!game) return;

    this.game = game;

    if (!this.selectedQuiz && game.quiz) {
      this.selectedQuiz = game.quiz;
    }

    this.cdr.detectChanges();
  }

  selectQuiz(quiz: Interfaces.Quiz): void {
    this.selectedQuiz = quiz;
    this.showInput = true;
  }

  register(): void {
    if (!this.playerName.trim()) return;

    this.rest.getGame({ name: this.playerName.trim(), quizId: this.selectedQuiz?.id ?? null })
      .subscribe({
        next: (data) => this.onRegistrationSuccess(data),
        error: (err) => this.error.handleError(err),
      });
  }

  play(): void {
    if (this.game?.quiz_completed) {
      this.nav.menu();
      return;
    }

    setTimeout(() => this.nav.game(), 1000);
  }

  onRegistrationSuccess(game: Interfaces.Game): void {
    this.gameService.setGame(game);
    this.game = game;
    this.showInput = false;
    this.cdr.detectChanges();

    localStorage.setItem('QuizStrike_player', this.playerName.trim());
    localStorage.setItem('QuizStrike_runningQuizId', this.game?.quiz.id.toString() ?? '');
  }

}