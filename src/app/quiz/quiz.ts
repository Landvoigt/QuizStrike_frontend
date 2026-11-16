import { ChangeDetectorRef, Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
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

  player: string = '';
  playerName: string = '';
  joining: boolean = false;

  private subs = new Subscription();

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly error = inject(ErrorService);
  readonly nav = inject(NavigationService);
  readonly gameService = inject(GameService);

  /** Loads quiz + refreshes stored player's progress; menu if id invalid. */
  ngOnInit(): void {
    this.quizId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(this.quizId) || this.quizId <= 0) {
      this.nav.menu();
      return;
    }

    this.subs.add(this.gameService.quiz$(this.quizId).subscribe((quiz) => this.onQuizLoaded(quiz)));
    this.subs.add(this.gameService.games$.subscribe(() => this.onGamesChanged()));

    this.gameService.restore(this.quizId).subscribe();
  }

  /** Stores quiz, re-renders; menu if quiz doesn't exist. */
  onQuizLoaded(quiz: Interfaces.Quiz | null): void {
    if (!quiz) {
      this.nav.menu();
      return;
    }

    this.quiz = quiz;
    this.cdr.detectChanges();
  }

  /** Syncs stored player of this quiz. */
  onGamesChanged(): void {
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

  /** Opens game; if already completed forgets player and shows error. */
  onJoined(game: Interfaces.Game): void {
    if (this.gameService.isCompleted(game)) {
      this.gameService.leave(this.quizId, { dropToken: true });
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

  /** Stops listeners. */
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
