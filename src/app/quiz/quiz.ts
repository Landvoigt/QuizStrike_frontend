import { ChangeDetectorRef, Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { NavigationService } from '../services/navigation.service';
import { GameService } from '../services/game.service';
import { ErrorService } from '../services/error.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-quiz',
  imports: [FormsModule],
  templateUrl: './quiz.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './quiz.scss',
})
export class QuizComponent implements OnInit, OnDestroy {
  quizId: number = 0;
  quiz: Interfaces.Quiz | null = null;
  game: Interfaces.Game | null = null;

  player: string = '';
  playerName: string = '';
  joining: boolean = false;

  private subs = new Subscription();

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private error: ErrorService,
    public nav: NavigationService,
    public gameService: GameService
  ) { }

  /** Loads quiz + refreshes stored player's progress. */
  ngOnInit(): void {
    this.quizId = Number(this.route.snapshot.paramMap.get('id'));

    this.subs.add(this.gameService.quiz$(this.quizId).subscribe((quiz) => this.onQuizLoaded(quiz)));
    this.subs.add(this.gameService.games$.subscribe((games) => this.onGamesChanged(games)));

    this.gameService.restore(this.quizId).subscribe();
  }

  /** Stores quiz, re-renders. */
  onQuizLoaded(quiz: Interfaces.Quiz | null): void {
    this.quiz = quiz;
    this.cdr.detectChanges();
  }

  /** Syncs game + player of this quiz. */
  onGamesChanged(games: Record<number, Interfaces.Game>): void {
    this.game = games[this.quizId] ?? null;
    this.player = this.gameService.getPlayer(this.quizId);
    this.cdr.detectChanges();
  }

  /** Joins with entered name, starts game unless completed. */
  register(nameInput: NgModel): void {
    const name = this.playerName.trim();
    if (!nameInput.valid || !name || this.joining) return;

    this.joining = true;
    this.gameService.join(this.quizId, name)
      .pipe(finalize(() => this.joining = false))
      .subscribe({
        next: (game) => this.onJoined(game),
        error: (err) => this.onJoinError(err),
      });
  }

  /** Opens game, or shows error if all questions answered. */
  onJoined(game: Interfaces.Game): void {
    if (this.gameService.isCompleted(game)) {
      this.error.handleError(this.error.GAME_FINISHED);
      return;
    }
    this.play();
  }

  /** Shows error (409 = name taken, 400 = invalid name, 429 = rate limit), clears name. */
  onJoinError(err: any): void {
    if (err?.status === 409) {
      this.error.handleError(this.error.NAME_TAKEN);
    } else if (err?.status === 400) {
      this.error.handleError(this.error.INVALID_NAME);
    } else if (err?.status === 429) {
      this.error.handleError(this.error.tooManyPlayers(err.error?.retry_after));
    } else {
      this.error.handleError(err);
    }
    this.playerName = '';
    this.cdr.detectChanges();
  }

  /** Opens game of this quiz. */
  play(): void {
    this.nav.game(this.quizId);
  }

  /** Forgets stored player, shows name input. */
  newPlayer(): void {
    this.gameService.leave(this.quizId, { dropToken: true });
    this.playerName = '';
  }

  /** Stops listeners. */
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
