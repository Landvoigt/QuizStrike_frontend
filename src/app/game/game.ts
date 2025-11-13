import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Answer, Game, Question, ResponseModel } from '../interfaces/quiz.interface';
import { GameService } from '../services/game.service';
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  startScreen: boolean = true;

  game: Game | null = null;

  questions: Question[] = [];
  currentQuestionIndex: number = -1;

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

  constructor(private gameService: GameService, private cdr: ChangeDetectorRef, private rest: RestService) { }

  ngOnInit(): void {
    this.gameService.game$.subscribe((game) => {
      if (!game) return;
      this.game = game;
      this.questions = this.getQueue();
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

  startGame() {
    this.startScreen = false;
    this.nextStep();
  }

  nextStep() {
    if (this.timerSubscription) {
      if (this.isFlipping || this.timeRunning) return;
    } else {
      this.clearAll();

      this.isFlipping = true;

      if (this.isQuestionSide) {
        this.nextQuestion();
      } else {
        this.nextQuestion();
      }

      this.step++;
      this.flipRotation = `rotateX(${this.step * 180}deg)`;
      this.isQuestionSide = !this.isQuestionSide;
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
    this.isFlipping = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.startTimer();
      this.cdr.detectChanges();
    }, 700);
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

    this.stopTimer();

    const question = this.questions[this.currentQuestionIndex];
    const selectedAnswer = question.answers[idx];

    this.selectedAnswerIdx = idx;
    this.correctAnswerIdx = question.answers.findIndex(a => a.correct);
    this.selectedAnswerCorrect = selectedAnswer.correct;

    this.sendResponse(selectedAnswer, question);

    if (!this.selectedAnswerCorrect) {
      this.showCorrectAnswer = true;
      this.cdr.detectChanges();
    }
  }

  sendResponse(answer: Answer, question: Question) {
    if (!this.game) return;

    const elapsedTime = Date.now() - this.startTime;
    const cappedElapsed = Math.min(elapsedTime, question.time);

    const response = new ResponseModel({
      player_name: localStorage.getItem('QuizStrike_player') ?? '',
      question_id: question.id,
      answer_id: answer.id,
      time: cappedElapsed
    });

    this.rest.saveResponse(response).subscribe({
      next: () => console.log('Response saved', response),
      error: (err) => console.error('Error saving response', err)
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  getQueue(): Question[] {
    return this.game?.remaining_questions
      ?.map(q => ({
        ...q,
        answers: [...q.answers].sort(() => Math.random() - 0.5)
      }))
      .sort(() => Math.random() - 0.5) ?? [];
  }

  private pad(num: number, size: number = 2): string {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }

}
