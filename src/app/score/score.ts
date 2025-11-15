import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RestService } from '../services/rest.service';
import { ErrorService } from '../services/error.service';
import { NavigationService } from '../services/navigation.service';
import { finalize, interval, Subscription } from 'rxjs';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-score',
  imports: [],
  templateUrl: './score.html',
  styleUrl: './score.scss',
})
export class ScoreComponent implements OnInit, OnDestroy {
  scores: Interfaces.Score[] = [];
  loading: boolean = true;

  refreshSub?: Subscription;

  previousPositions: Record<string, number> = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private rest: RestService,
    private error: ErrorService,
    public nav: NavigationService
  ) { }

  ngOnInit(): void {
    this.getScores();
    this.refreshSub = interval(5000).subscribe(() => this.getScores());
  }

  getScores(): void {
    this.setLoading(true);

    this.rest.getScores()
      .pipe(finalize(() => this.setLoading(false)))
      .subscribe({
        next: (data) => this.onScoresLoaded(data),
        error: (error) => this.error.handleError(error)
      });
  }

  onScoresLoaded(data: Interfaces.Score[]): void {
    const sortedData = this.sortScores(data);

    this.initializePreviousPositions(sortedData);
    this.updateScores(sortedData);
    this.animateScoreRows(sortedData);
  }

  sortScores(data: Interfaces.Score[]): Interfaces.Score[] {
    return [...data].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time - b.time;
    });
  }

  initializePreviousPositions(data: Interfaces.Score[]): void {
    if (!this.previousPositions || Object.keys(this.previousPositions).length === 0) {
      data.forEach((s, i) => this.previousPositions[s.id] = i);
    }
  }

  updateScores(data: Interfaces.Score[]): void {
    if (this.scores.length === data.length) {
      data.forEach((updated) => {
        const old = this.scores.find(s => s.id === updated.id);
        if (old && (old.score !== updated.score || old.time !== updated.time)) {
          old.score = updated.score;
          old.time = updated.time;
          old.justUpdated = true;

          setTimeout(() => {
            old.justUpdated = false;
            this.cdr.detectChanges();
          }, 1000);
        }
      });
    } else {
      this.scores = data.map(s => ({ ...s, justUpdated: false }));
      this.cdr.detectChanges();
    }
  }

  animateScoreRows(data: Interfaces.Score[]): void {
    data.forEach((s, i) => {
      const rowEl = document.querySelector(`.score-row[data-id='${s.id}']`) as HTMLElement;
      if (!rowEl) return;

      const oldPos = this.previousPositions[s.id];
      rowEl.style.top = `${i * 3}rem`;
      rowEl.classList.remove('goUp', 'goDown');

      if (oldPos > i) rowEl.classList.add('goUp');
      else if (oldPos < i) rowEl.classList.add('goDown');
    });

    data.forEach((s, i) => this.previousPositions[s.id] = i);
    this.cdr.detectChanges();
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  setLoading(value: boolean): void {
    this.loading = value;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

}
