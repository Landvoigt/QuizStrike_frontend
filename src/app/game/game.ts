import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { GameService } from '../services/game.service';
import { RestService } from '../services/rest.service';
import { NavigationService } from '../services/navigation.service';
import { ErrorService } from '../services/error.service';
import { StorageService } from '../services/storage.service';

import * as Interfaces from '../interfaces';
import * as Models from '../models';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './game.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  isStarted: boolean = false;

  @ViewChild('counter') counterRef?: ElementRef<HTMLElement>;

  timerActive: boolean = false;
  private timerFrameId: number | null = null;
  private timerTimeoutId: ReturnType<typeof setTimeout> | null = null;
  startTime!: number;

  formattedTime: string = '00.000';

  timeRunning: boolean = false;
  timePaused: boolean = false;

  selectedAnswerIdx: number | null = null;
  selectedAnswerCorrect: boolean | null = null;
  correctAnswerIdx: number | null = null;
  showCorrectAnswer: boolean = false;

  flipRotation: string = 'rotateX(0deg)';

  DEFAULT_TIME_LIMIT: number = 10000;
  IMAGE_PRELOAD_TIMEOUT: number = 400;

  constructor(
    private cdr: ChangeDetectorRef,
    private rest: RestService,
    private error: ErrorService,
    private nav: NavigationService,
    private gameService: GameService,
    private storage: StorageService
  ) { }

  ngOnInit(): void {
    if (!this.getPlayer() || !this.getQuiz()) {
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
    await this.nextStep();
  }

  async nextStep(): Promise<void> {
    if (!this.game || this.inProgress() || this.isStarted) return;

    this.isStarted = true;

    let response;

    try {
      const payload = new Models.QuestionStartModel(this.getPlayer(), this.getQuiz());
      response = await firstValueFrom(this.rest.startQuestion(payload, this.gameService.getToken()));
      this.startScreen = false;
    } catch (err: any) {
      this.isStarted = false;
      if (err?.status === 403) {
        this.handleInvalidToken();
      } else {
        this.error.handleError(err);
      }
      return;
    }

    if (response.quiz_completed) {
      this.gameService.resetSession();
      this.nav.menu();
      return;
    }

    await this.preloadImage(this.imageUrl(response));

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

  onFlipFinished(event: TransitionEvent): void {
    if (event.propertyName !== 'transform') return;
    if (!this.isFlipping) return;

    this.isFlipping = false;
    this.startTimer();
    this.cdr.detectChanges();
  }

  answer(idx: number): void {
    if (!this.timerActive || this.timePaused || this.selectedAnswerIdx !== null) return;

    if (!this.currentQuestion) {
      console.warn('No current question available.');
      return;
    }

    const answers = this.currentQuestion.question.answers;
    if (!answers || idx < 0 || idx >= answers.length) {
      console.warn('Invalid answer index:', idx);
      return;
    }

    const elapsed = this.elapsed();
    this.stopTimer();

    this.selectedAnswerIdx = idx;
    this.cdr.detectChanges();

    this.sendResponse(answers[idx], elapsed);
  }

  sendResponse(answer: Interfaces.Answer | null, elapsed: number): void {
    if (!this.currentQuestion || !this.game) return;

    const limit = this.timeLimit();
    const time = answer ? Math.min(Math.max(0, Math.round(elapsed)), limit) : limit;
    this.buildFormattedTime(time);

    const payload = this.buildQuestionFinish(answer, time);

    this.rest.finishQuestion(payload, this.gameService.getToken()).subscribe({
      next: (result) => this.showResult(result),
      error: (err) => this.onFinishError(err),
    });
  }

  showResult(result: Interfaces.QuestionFinishResult): void {
    const answers = this.currentQuestion?.question?.answers ?? [];
    const correctIdx = answers.findIndex(a => a.id === result.correct_answer_id);

    this.correctAnswerIdx = correctIdx >= 0 ? correctIdx : null;
    this.selectedAnswerCorrect = result.correct;
    this.showCorrectAnswer = !result.correct;
    this.isStarted = false;

    if (typeof result.time === 'number') {
      this.formattedTime = this.formatTime(result.time);
    }
    this.cdr.detectChanges();
  }

  onFinishError(err: any): void {
    if (err?.status === 409) {
      this.isStarted = false;
      this.cdr.detectChanges();
      return;
    }

    if (err?.status === 403) {
      this.isStarted = false;
      this.handleInvalidToken();
      return;
    }

    this.error.handleError(err);
    this.isStarted = false;
    this.cdr.detectChanges();
  }

  handleInvalidToken(): void {
    this.stopTimer();
    this.gameService.resetSession({ dropToken: true });
    this.error.handleError(this.error.INVALID_TOKEN);
    this.nav.menu();
  }

  startTimer(): void {
    this.stopTimer();

    this.timeRunning = true;
    this.timePaused = false;
    this.timerActive = true;
    this.startTime = performance.now();

    this.timerTimeoutId = setTimeout(() => this.handleTimeout(), this.timeLimit());

    const tick = () => {
      if (!this.timerActive) return;
      this.renderTime(this.elapsed());
      this.timerFrameId = requestAnimationFrame(tick);
    };
    this.timerFrameId = requestAnimationFrame(tick);
  }

  stopTimer(): void {
    if (!this.timerActive) return;

    this.timerActive = false;
    if (this.timerFrameId !== null) cancelAnimationFrame(this.timerFrameId);
    if (this.timerTimeoutId !== null) clearTimeout(this.timerTimeoutId);
    this.timerFrameId = null;
    this.timerTimeoutId = null;
    this.timePaused = true;
  }

  elapsed(): number {
    return performance.now() - this.startTime;
  }

  renderTime(elapsed: number): void {
    this.formattedTime = this.formatTime(elapsed);
    const textNode = this.counterRef?.nativeElement.firstChild;
    if (textNode) {
      textNode.nodeValue = this.formattedTime;
    }
  }

  handleTimeout(): void {
    this.stopTimer();

    if (this.selectedAnswerIdx == null) {
      this.sendResponse(null, this.timeLimit());
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

  timeLimit(): number {
    return this.currentQuestion?.question?.time || this.DEFAULT_TIME_LIMIT;
  }

  buildFormattedTime(elapsed: number): void {
    this.formattedTime = this.formatTime(elapsed);
    this.cdr.detectChanges();
  }

  formatTime(elapsed: number): string {
    const capped = Math.floor(Math.min(Math.max(0, elapsed), this.timeLimit()));
    const seconds = Math.floor(capped / 1000);
    const milliseconds = capped % 1000;
    return `${this.pad(seconds)}.${this.pad(milliseconds, 3)}`;
  }

  async preloadImage(url: string | null): Promise<void> {
    if (!url) return;

    const img = new Image();
    img.src = url;

    const timeout = new Promise<void>(resolve => setTimeout(resolve, this.IMAGE_PRELOAD_TIMEOUT));
    await Promise.race([img.decode().catch(() => undefined), timeout]);
  }

  buildQuestionFinish(answer: Interfaces.Answer | null, time: number): Models.QuestionFinishModel {
    return new Models.QuestionFinishModel({
      response_id: this.currentQuestion?.response_id ?? 0,
      answer_id: answer?.id ?? null,
      time
    });
  }

  getPlayer(): string {
    return this.storage.getString('QuizStrike_player');
  }

  getQuiz(): number {
    return this.storage.getNumber('QuizStrike_runningQuizId');
  }

  getRemainingQuestionsCount(): string {
    if (!this.game) return '';
    return String(this.game.total_questions - this.game.answered_questions);
  }

  pad(num: number, size: number = 2): string {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }

  imageUrl(question: Interfaces.QuestionStart | null): string | null {
    const image = question?.question?.image || question?.question?.category?.image;
    return image ? this.rest.getBaseUrl() + image : null;
  }

  background(question: Interfaces.QuestionStart | null): string {
    const url = this.imageUrl(question);
    return url ? `url(${url})` : 'none';
  }

  inProgress(): boolean {
    return this.timerActive && (this.isFlipping || this.timeRunning);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

}
