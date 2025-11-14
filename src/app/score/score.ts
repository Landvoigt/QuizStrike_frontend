import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RestService } from '../services/rest.service';
import { ErrorService } from '../services/error.service';
import { NavigationService } from '../services/navigation.service';
import { interval, Subscription } from 'rxjs';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-score',
  imports: [],
  templateUrl: './score.html',
  styleUrl: './score.scss',
})
export class ScoreComponent implements OnInit, OnDestroy {
  scores: Interfaces.Score[] = [];
  private refreshSub?: Subscription;

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
    this.rest.getScores().subscribe({
      next: (data) => this.onScoresLoaded(data),
      error: (error) => this.error.handleError(error)
    });
  }

  onScoresLoaded(data: Interfaces.Score[]): void {
    if (this.scores.length === data.length) {
      for (let i = 0; i < data.length; i++) {
        const old = this.scores[i];
        const updated = data[i];

        if (old.score !== updated.score || old.time !== updated.time) {
          old.score = updated.score;
          old.time = updated.time;
          old.justUpdated = true;

          setTimeout(() => {
            old.justUpdated = false;
            this.cdr.detectChanges();
          }, 1000);
        }
      }
    } else {
      this.scores = data.map(s => ({ ...s, justUpdated: false }));
    }

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

}
