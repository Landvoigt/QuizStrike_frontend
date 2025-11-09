import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { Question, Quiz } from '../interfaces/quiz.interface';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgClass],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  selectedQuiz: Quiz | null = null;
  queue: Question[] = [];

  currentQuestionIndex: number = 0;
  step: number = 0;

  isFlipping = false;
  
  formattedTime = '00.000';
  startTime!: number;
  timerSubscription?: Subscription;
  timeRunning: boolean = false;

  get flipRotation(): string {
    return `rotateX(${this.step * 180}deg)`;
  }

  constructor(private game: GameService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.game.selectedQuiz$.subscribe(sq => {
      if (!sq) return;

      this.selectedQuiz = sq;
      this.queue = this.getQueue();
      console.log(this.queue);
      this.cdr.detectChanges();
    });

  }

  startTimer() {
    this.stopTimer();

    this.timeRunning = true;
    this.startTime = Date.now();

    this.timerSubscription = interval(1).subscribe(() => {
      const elapsed = Date.now() - this.startTime;
      const cappedElapsed = Math.min(elapsed, 10000);

      const seconds = Math.floor(cappedElapsed / 1000);
      const milliseconds = cappedElapsed % 1000;
      this.formattedTime = `${this.pad(seconds)}.${this.pad(milliseconds, 3)}`;

      this.cdr.detectChanges();

      if (elapsed >= 10000) {
        this.stopTimer();
      }
    });
  }

  stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  answer(idx: number) {
    this.stopTimer();
  }

  stopTimerManually(): void {
    this.stopTimer();
  }

  private pad(num: number, size: number = 2): string {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }

  nextStep() {
    if (this.isFlipping) return;
    this.isFlipping = true;

    this.step++;

    setTimeout(() => {
      if (this.step > 0 && this.step % 2 === 0 && this.currentQuestionIndex < this.queue.length - 1) {
        this.currentQuestionIndex++;
      }
      this.isFlipping = false;
      this.cdr.detectChanges();
    }, 700);
  }

  sendResponse(answerIndex: number) {

  }

  ngOnDestroy() {
    this.stopTimer();
  }

  getQueue(): Question[] {
    return this.selectedQuiz?.questions
      ?.map(q => ({
        ...q,
        answers: [...q.answers].sort(() => Math.random() - 0.5)
      }))
      .sort(() => Math.random() - 0.5) ?? [];
  }

}
