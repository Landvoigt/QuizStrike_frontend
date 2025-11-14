import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { GameService } from '../services/game.service';
import { RestService } from '../services/rest.service';
import { NavigationService } from '../services/navigation.service';
import { ErrorService } from '../services/error.service';

import * as Interfaces from '../interfaces';
import * as Models from '../models';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgTemplateOutlet, NgStyle],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  game: Interfaces.Game | null = null;

  questions: Interfaces.Question[] = [];
  currentQuestionIndex: number = -1;

  step: number = 0;

  startScreen: boolean = true;
  isQuestionSide: boolean = false;
  isFlipping: boolean = false;

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
    this.questions = this.getQueue();
    this.cdr.detectChanges();
  }

  startGame(): void {
    this.startScreen = false;
    this.nextStep();
  }

  nextStep(): void {
    if (this.timerSubscription && (this.isFlipping || this.timeRunning)) {
      return;
    }

    this.clearAll();
    this.isFlipping = true;

    this.nextQuestion();

    this.step++;
    this.flipRotation = `rotateX(${this.step * 180}deg)`;
    this.isQuestionSide = !this.isQuestionSide;
  }

  nextQuestion(): void {
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

  answer(idx: number): void {
    if (this.timePaused) return;

    this.stopTimer();

    const question = this.questions[this.currentQuestionIndex];
    const selectedAnswer = question.answers[idx];

    this.setAnswer(idx, selectedAnswer, question);
  }

  setAnswer(idx: number, answer: Interfaces.Answer, question: Interfaces.Question): void {
    this.selectedAnswerIdx = idx;
    this.correctAnswerIdx = question.answers.findIndex(a => a.correct);
    this.selectedAnswerCorrect = answer.correct;

    this.sendResponse(answer, question);

    if (!answer.correct) {
      this.showCorrectAnswer = true;
      this.cdr.detectChanges();
    }
  }

  sendResponse(answer: Interfaces.Answer, question: Interfaces.Question): void {
    if (!this.game) return;

    const elapsedTime = Date.now() - this.startTime;
    const time = Math.min(elapsedTime, question.time);

    const response = this.buildResponse(answer, question, time);

    this.rest.saveResponse(response).subscribe({
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
      const question = this.questions[this.currentQuestionIndex];
      this.correctAnswerIdx = question.answers.findIndex(a => a.correct);
      this.selectedAnswerCorrect = false;
      this.showCorrectAnswer = true;
      this.cdr.detectChanges();
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

  getQueue(): Interfaces.Question[] {
    return this.game?.remaining_questions
      ?.map(q => ({
        ...q,
        answers: [...q.answers].sort(() => Math.random() - 0.5)
      }))
      .sort(() => Math.random() - 0.5) ?? [];
  }

  buildResponse(answer: Interfaces.Answer, question: Interfaces.Question, time: number): Models.ResponseModel {
    return new Models.ResponseModel({
      player_name: localStorage.getItem('QuizStrike_player') ?? '',
      question_id: question.id,
      answer_id: answer.id,
      time: time
    });
  }

  buildFormattedTime(elapsed: number): void {
    const capped = Math.min(elapsed, 10000);
    const seconds = Math.floor(capped / 1000);
    const milliseconds = capped % 1000;
    this.formattedTime = `${this.pad(seconds)}.${this.pad(milliseconds, 3)}`;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

}