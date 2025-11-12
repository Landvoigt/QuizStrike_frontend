import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Answer, Question, Quiz } from '../interfaces/quiz.interface';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  selectedQuiz: Quiz | null = null;

  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  queue: Question[] = [];
  currentQueueIndex: number = 0;

  step: number = 0;

  isQuestionSide: boolean = false;
  isFlipping: boolean = false;

  formattedTime: string = '00.000';
  startTime!: number;
  timerSubscription?: Subscription;
  timeRunning: boolean = false;
  timePaused: boolean = false;

  flipRotation = 'rotateX(0deg)';

  selectedAnswerIdx: number | null = null;
  selectedAnswerCorrect: boolean | null = null;
  correctAnswerIdx: number | null = null;
  showCorrectAnswer: boolean = false;

  constructor(private game: GameService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.game.selectedQuiz$.subscribe(quiz => {
      if (!quiz) return;

      this.selectedQuiz = quiz;
      this.questions = this.getQueue();
      this.queue = [...this.questions];

      console.log(this.questions);
      this.cdr.detectChanges();
    });
  }

  clearAll() {
    this.selectedAnswerIdx = null;
    this.selectedAnswerCorrect = null;
    this.correctAnswerIdx = null;
    this.showCorrectAnswer = false;
    this.formattedTime = '00.000';
    this.timeRunning = false;
    this.timePaused = false;
    this.cdr.detectChanges();
  }

  nextStep() {
    if (this.timerSubscription) {
      if (this.isFlipping || this.timeRunning) return;
    } else {
      this.clearAll();

      this.isFlipping = true;

      if (this.isQuestionSide) {
        this.nextQueue();
      } else {
        this.nextQuestion();
      }

      this.step++;
      this.flipRotation = `rotateX(${this.step * 180}deg)`;
      this.isQuestionSide = !this.isQuestionSide;
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.queue.length - 1) {
      this.currentQuestionIndex++;
    }
    this.isFlipping = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.startTimer();
      this.cdr.detectChanges();
    }, 700);
  }

  nextQueue() {
    if (this.currentQueueIndex < this.queue.length - 1) {
      this.currentQueueIndex++;
    }
    this.isFlipping = false;
    this.cdr.detectChanges();
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

        if (!this.selectedAnswerIdx) {
          this.correctAnswerIdx = this.questions[this.currentQuestionIndex].answers.findIndex(a => a.correct);
          this.selectedAnswerCorrect = false;
          this.showCorrectAnswer = true;
          this.cdr.detectChanges();
        }
      }
    });
  }

  stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
      this.timePaused = true;
    }
  }

  answer(idx: number) {
    if (this.timePaused) return;

    this.sendResponse(idx);

    this.stopTimer();

    const answers = this.questions[this.currentQuestionIndex].answers;
    const selectedAnswer = answers[idx];

    this.selectedAnswerIdx = idx;
    this.correctAnswerIdx = answers.findIndex(a => a.correct);
    this.selectedAnswerCorrect = selectedAnswer.correct;

    console.log('Answered:', this.answer);

    if (!this.selectedAnswerCorrect) {
      this.showCorrectAnswer = true;
      this.cdr.detectChanges();

      // setTimeout(() => {
      //   this.showCorrectAnswer = false;
      // }, 1500);
    }

    // this.nextStep();
  }

  private pad(num: number, size: number = 2): string {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }

  sendResponse(answerIdx: number) {

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
