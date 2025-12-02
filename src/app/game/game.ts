import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { firstValueFrom, interval, Subscription } from 'rxjs';
import { GameService } from '../services/game.service';
import { RestService } from '../services/rest.service';
import { NavigationService } from '../services/navigation.service';
import { ErrorService } from '../services/error.service';

import * as Interfaces from '../interfaces';
import * as Models from '../models';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  game: Interfaces.Game | null = null;

  currentQuestion: Interfaces.QuestionStart | null = null;

  step: number = 0;

  startScreen: boolean = true;
  isQuestionSide: boolean = false;
  isFlipping: boolean = false;
  isTransitioning: boolean = false;

  timerSubscription?: Subscription;
  startTime!: number;

  formattedTime: string = '00.000';

  timeRunning: boolean = false;
  timePaused: boolean = false;

  selectedAnswerIdx: number | null = null;
  selectedAnswerCorrect: boolean | null = null;
  correctAnswerIdx: number | null = null;
  showCorrectAnswer: boolean = false;

  flipRotation: string = 'rotateX(0deg)';

  constructor(
    private cdr: ChangeDetectorRef,
    private rest: RestService,
    private error: ErrorService,
    private nav: NavigationService,
    private gameService: GameService,
  ) { }

  ngOnInit(): void {
    const storedName = localStorage.getItem('QuizStrike_player');
    const storedQuizId = localStorage.getItem('QuizStrike_runningQuizId');

    if (!storedName || !storedQuizId) {
      this.nav.menu();
      return;
    }

    const timeout = setTimeout(() => {
      if (!this.gameService.getGame()) {
        this.nav.menu();
      }
    }, 3000);

    this.gameService.game$.subscribe((game) => this.onGameLoaded(game, timeout));
  }

  onGameLoaded(game: Interfaces.Game | null, timeout: any): void {
    if (!game) return;

    clearTimeout(timeout);

    this.game = game;
    this.cdr.detectChanges();
  }

  async startGame(): Promise<void> {
    this.startScreen = false;
    await this.nextStep();
  }

  async nextStep(): Promise<void> {
    if (!this.game) return;

    if (this.timerSubscription && (this.isFlipping || this.timeRunning)) {
      return;
    }

    const player_name = localStorage.getItem('QuizStrike_player') ?? '';
    const quiz_id = Number(localStorage.getItem('QuizStrike_runningQuizId'));
    const payload = new Models.QuestionStartModel({ player_name, quiz_id });

    let response;

    try {
      response = await firstValueFrom(this.rest.startQuestion(payload));
    } catch (err) {
      this.error.handleError(err);
      return;
    }

    if (response.quiz_completed) {
      this.nav.menu();
      localStorage.removeItem('QuizStrike_player');
      localStorage.removeItem('QuizStrike_runningQuizId');
      return;
    }

    this.clearAll();

    this.isFlipping = true;

    this.currentQuestion = response;

    await Promise.resolve();
    this.cdr.detectChanges();

    this.step++;
    this.flipRotation = `rotateX(${this.step * 180}deg)`;
    this.isQuestionSide = !this.isQuestionSide;

    this.cdr.detectChanges();
  }

  nextQuestion(): void {
    // this.currentQuestion = response.question;
  }

  onFlipFinished(event: TransitionEvent): void {
    if (event.propertyName !== 'transform') return;
    if (!this.isFlipping) return;

    this.isFlipping = false;
    this.startTimer();
    this.cdr.detectChanges();
  }

  answer(idx: number): void {
    if (this.timePaused) return;

    this.stopTimer();

    if (!this.currentQuestion) {
      console.warn('No current question available.');
      return;
    }

    const answers = this.currentQuestion.question.answers;
    if (!answers || idx < 0 || idx >= answers.length) {
      console.warn('Invalid answer index:', idx);
      return;
    }

    const selectedAnswer = answers[idx];
    this.setAnswer(idx, selectedAnswer, this.currentQuestion.question);
  }

  setAnswer(idx: number, answer: Interfaces.Answer, question: Interfaces.Question): void {
    this.selectedAnswerIdx = idx;
    this.correctAnswerIdx = question.answers.findIndex(a => a.correct);
    this.selectedAnswerCorrect = answer.correct;

    this.sendResponse(answer);

    if (!answer.correct) {
      this.showCorrectAnswer = true;
      this.cdr.detectChanges();
    }
  }

  sendResponse(answer: Interfaces.Answer | null): void {
    if (!this.currentQuestion || !this.game) return;

    const elapsedTime = Date.now() - this.startTime;
    const time = Math.min(elapsedTime, this.currentQuestion.question.time);

    const response = new Models.QuestionFinishModel({
      response_id: this.currentQuestion?.response_id ?? 0,
      answer_id: answer?.id ?? null,
      time
    });

    this.rest.finishQuestion(response).subscribe({
      next: () => { return; },
      error: (err) => this.error.handleError(err),
    });
  }

  startTimer(): void {
    this.stopTimer();

    this.timeRunning = true;
    this.startTime = Date.now();

    const maxTime = 10000;

    this.timerSubscription = interval(1).subscribe(() => {
      const elapsed = Date.now() - this.startTime;
      this.buildFormattedTime(elapsed);

      if (elapsed >= maxTime) {
        this.handleTimeout();
      }
    });
  }

  stopTimer(): void {
    if (!this.timerSubscription) return;

    this.timerSubscription.unsubscribe();
    this.timerSubscription = undefined;
    this.timePaused = true;
  }

  handleTimeout(): void {
    this.stopTimer();

    if (this.selectedAnswerIdx == null) {
      const correctIdx = this.currentQuestion?.question?.answers.findIndex(a => a.correct) ?? null;
      this.correctAnswerIdx = correctIdx;
      this.selectedAnswerCorrect = false;
      this.showCorrectAnswer = true;
      this.cdr.detectChanges();

      this.sendResponse(null);
    }
  }

  clearAll(): void {
    this.selectedAnswerIdx = null;
    this.selectedAnswerCorrect = null;
    this.correctAnswerIdx = null;
    this.showCorrectAnswer = false;
    this.formattedTime = '00.000';
    this.timeRunning = false;
    this.timePaused = false;
    this.cdr.detectChanges();
  }

  pad(num: number, size: number = 2): string {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }

  // buildStartResponse(question: Interfaces.Question): Models.QuestionStartModel {
  //   return new Models.QuestionStartModel({
  //     player_name: localStorage.getItem('QuizStrike_player') ?? '',
  //     question_id: question.id,
  //   });
  // }

  // buildFinishResponse(answer: Interfaces.Answer | null, question: Interfaces.Question, time: number): Models.QuestionFinishModel {
  //   return new Models.QuestionFinishModel({
  //     player_name: localStorage.getItem('QuizStrike_player') ?? '',
  //     question_id: question.id,
  //     answer_id: answer?.id ?? null,
  //     time: time
  //   });
  // }

  buildFormattedTime(elapsed: number): void {
    const capped = Math.min(elapsed, 10000);
    const seconds = Math.floor(capped / 1000);
    const milliseconds = capped % 1000;
    this.formattedTime = `${this.pad(seconds)}.${this.pad(milliseconds, 3)}`;
    this.cdr.detectChanges();
  }

  background(question: Interfaces.QuestionStart | null): string {
    if (!question?.question) return 'none';

    if (question.question.image) {
      return `url('http://127.0.0.1:8000/${question.question.image}')`;
    }

    switch (question.question.category) {
      case 1: return `url('assets/images/basics.webp')`;
      case 2: return `url('assets/images/maps.avif')`;
      case 3: return `url('assets/images/esports.jpg')`;
      case 4: return `url('assets/images/moments.webp')`;
      case 5: return `url('assets/images/skins.webp')`;
      default: return 'none';
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

}