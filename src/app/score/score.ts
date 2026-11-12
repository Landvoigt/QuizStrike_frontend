import { ChangeDetectorRef, Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize, interval, Subscription } from 'rxjs';

import { RestService } from '../services/rest.service';
import { ErrorService } from '../services/error.service';
import { NavigationService } from '../services/navigation.service';
import { GameService } from '../services/game.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-score',
  imports: [],
  templateUrl: './score.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './score.scss',
})
export class ScoreComponent implements OnInit, OnDestroy {
  scores: Interfaces.Score[] = [];
  loading: boolean = true;

  refreshSub?: Subscription;

  previousPositions: Record<string, number> = {};

  quizId: number = 0;
  quiz: Interfaces.Quiz | null = null;
  private quizSub?: Subscription;

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private rest: RestService,
    private error: ErrorService,
    private gameService: GameService,
    public nav: NavigationService
  ) { }

  /** Loads quiz + its scores, refreshes every 5 s. */
  ngOnInit(): void {
    this.quizId = Number(this.route.snapshot.paramMap.get('id'));
    this.quizSub = this.gameService.quiz$(this.quizId).subscribe((quiz) => {
      if (!quiz) {
        this.nav.menu();
        return;
      }
      this.quiz = quiz;
      this.cdr.detectChanges();
    });

    this.getScores();
    this.refreshSub = interval(5000).subscribe(() => this.getScores());
  }

  /** Fetches scores from API, toggles loading state. */
  getScores(): void {
    this.setLoading(true);

    this.rest.getScores(this.quizId)
      .pipe(finalize(() => this.setLoading(false)))
      .subscribe({
        next: (data) => this.onScoresLoaded(data),
        error: (error) => this.error.handleError(error)
      });
  }

  /** Updates and animates loaded scores (sorted by backend). */
  onScoresLoaded(data: Interfaces.Score[]): void {
    this.initializePreviousPositions(data);
    this.updateScores(data);
    this.animateScoreRows(data);
  }

  /** Stores initial row positions on first load. */
  initializePreviousPositions(data: Interfaces.Score[]): void {
    if (!this.previousPositions || Object.keys(this.previousPositions).length === 0) {
      data.forEach((s, i) => this.previousPositions[s.id] = i);
    }
  }

  /** Updates changed scores in place, or replaces list if players changed. */
  updateScores(data: Interfaces.Score[]): void {
    if (this.samePlayers(data)) {
      data.forEach((updated) => {
        const old = this.scores.find(s => s.id === updated.id);
        if (old && (old.score !== updated.score || old.time !== updated.time)) {
          old.score = updated.score;
          old.time = updated.time;
        }
      });
    } else {
      this.scores = [...data];
      this.cdr.detectChanges();
    }
  }

  /** True if list has exactly the current score ids. */
  samePlayers(data: Interfaces.Score[]): boolean {
    if (this.scores.length !== data.length) return false;
    const ids = new Set(this.scores.map(s => s.id));
    return data.every(s => ids.has(s.id));
  }

  /** Moves rows to new positions, adds up/down animation, resizes container. */
  animateScoreRows(data: Interfaces.Score[]): void {
    const rowHeight = window.innerWidth < 640 ? 2.375 : 3;

    data.forEach((s, i) => {
      const rowEl = document.querySelector(`.score-row[data-id='${s.id}']`) as HTMLElement;
      if (!rowEl) return;

      const oldPos = this.previousPositions[s.id];
      rowEl.style.top = `${i * rowHeight}rem`;
      rowEl.classList.remove('goUp', 'goDown');

      if (oldPos > i) rowEl.classList.add('goUp');
      else if (oldPos < i) rowEl.classList.add('goDown');
    });

    const container = document.querySelector('.score-wrapper') as HTMLElement;
    if (container) {
      container.style.height = `${data.length * rowHeight}rem`;
    }

    data.forEach((s, i) => this.previousPositions[s.id] = i);
    this.cdr.detectChanges();
  }

  /** Formats ms as `m:ss.mmm`. */
  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  /** Sets loading flag, re-renders. */
  setLoading(value: boolean): void {
    this.loading = value;
    this.cdr.detectChanges();
  }

  /** Stops auto-refresh + quiz listener. */
  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.quizSub?.unsubscribe();
  }

}
