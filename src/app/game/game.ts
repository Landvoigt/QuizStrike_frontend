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

  /** Waits for game data; back to menu if none after 3 s. */
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

  /** Stores loaded game, cancels menu fallback. */
  onGameLoaded(game: Interfaces.Game | null, timeout: any): void {
    if (!game) return;

    clearTimeout(timeout);

    this.game = game;
    this.cdr.detectChanges();
  }

  /** Starts quiz from start screen. */
  async startGame(): Promise<void> {
    await this.nextStep();
  }

  /** Loads next question and flips to it; menu when quiz completed. */
  async nextStep(): Promise<void> {
    if (!this.game || this.inProgress() || this.isStarted) return;

    this.isStarted = true;

    const response = await this.fetchQuestion();
    if (!response) return;

    if (response.quiz_completed) {
      this.finishQuiz();
      return;
    }

    await this.showQuestion(response);
  }

  /** Calls `/start/`; null on error (403 → back to name input). */
  async fetchQuestion(): Promise<Interfaces.QuestionStart | null> {
    try {
      const payload = new Models.QuestionStartModel(this.getPlayer(), this.getQuiz());
      const response = await firstValueFrom(this.rest.startQuestion(payload, this.gameService.getToken()));
      this.startScreen = false;
      return response;
    } catch (err: any) {
      this.isStarted = false;
      if (err?.status === 403) {
        this.handleInvalidToken();
      } else {
        this.error.handleError(err);
      }
      return null;
    }
  }

  /** Ends session, back to menu. */
  finishQuiz(): void {
    this.gameService.resetSession();
    this.nav.menu();
  }

  /** Preloads image, resets state, flips to question. */
  async showQuestion(response: Interfaces.QuestionStart): Promise<void> {
    await this.preloadImage(this.imageUrl(response));

    this.clearAll();

    this.isFlipping = true;
    this.currentQuestion = response;

    await Promise.resolve();

    this.cdr.detectChanges();
    this.flip();
  }

  /** Rotates cards by 180°, swaps visible side. */
  flip(): void {
    this.step++;
    this.flipRotation = `rotateX(${this.step * 180}deg)`;
    this.isQuestionSide = !this.isQuestionSide;

    this.cdr.detectChanges();
  }

  /** Flip done → question visible, starts timer. */
  onFlipFinished(event: TransitionEvent): void {
    if (event.propertyName !== 'transform') return;
    if (!this.isFlipping) return;

    this.isFlipping = false;
    this.startTimer();
    this.cdr.detectChanges();
  }

  /** Selects answer, stops timer, submits. */
  answer(idx: number): void {
    const selected = this.getAnswer(idx);
    if (!selected) return;

    const elapsed = this.elapsed();
    this.stopTimer();

    this.selectedAnswerIdx = idx;
    this.cdr.detectChanges();

    this.sendResponse(selected, elapsed);
  }

  /** Answer at index; null if timer not running, already answered or invalid. */
  getAnswer(idx: number): Interfaces.Answer | null {
    if (!this.timerActive || this.timePaused || this.selectedAnswerIdx !== null) return null;

    const answers = this.currentQuestion?.question?.answers;
    if (!answers || idx < 0 || idx >= answers.length) {
      console.warn('Invalid answer index:', idx);
      return null;
    }

    return answers[idx];
  }

  /** Sends answer (null = timeout) to `/finish/`. */
  sendResponse(answer: Interfaces.Answer | null, elapsed: number): void {
    if (!this.currentQuestion || !this.game) return;

    const time = this.responseTime(answer, elapsed);
    this.buildFormattedTime(time);

    const payload = this.buildQuestionFinish(answer, time);

    this.rest.finishQuestion(payload, this.gameService.getToken()).subscribe({
      next: (result) => this.showResult(result),
      error: (err) => this.onFinishError(err),
    });
  }

  /** Submitted time in ms: rounded + capped, time limit on timeout. */
  responseTime(answer: Interfaces.Answer | null, elapsed: number): number {
    const limit = this.timeLimit();
    return answer ? Math.min(Math.max(0, Math.round(elapsed)), limit) : limit;
  }

  /** Marks right/wrong answer, shows stored time. */
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

  /** `/finish/` error: 409 = already sent (ok), 403 = invalid token, else alert. */
  onFinishError(err: any): void {
    this.isStarted = false;

    if (err?.status === 409) {
      this.cdr.detectChanges();
      return;
    }

    if (err?.status === 403) {
      this.handleInvalidToken();
      return;
    }

    this.error.handleError(err);
    this.cdr.detectChanges();
  }

  /** Drops session + token, back to name input. */
  handleInvalidToken(): void {
    this.stopTimer();
    this.gameService.resetSession({ dropToken: true });
    this.error.handleError(this.error.INVALID_TOKEN);
    this.nav.menu();
  }

  /** Starts display loop + timeout deadline. */
  startTimer(): void {
    this.stopTimer();

    this.timeRunning = true;
    this.timePaused = false;
    this.timerActive = true;
    this.startTime = performance.now();

    this.timerTimeoutId = setTimeout(() => this.handleTimeout(), this.timeLimit());
    this.timerFrameId = requestAnimationFrame(() => this.tick());
  }

  /** One frame: renders time, schedules next frame. */
  tick(): void {
    if (!this.timerActive) return;

    this.renderTime(this.elapsed());
    this.timerFrameId = requestAnimationFrame(() => this.tick());
  }

  /** Stops loop + deadline, pauses progress bar. */
  stopTimer(): void {
    if (!this.timerActive) return;

    this.timerActive = false;
    if (this.timerFrameId !== null) cancelAnimationFrame(this.timerFrameId);
    if (this.timerTimeoutId !== null) clearTimeout(this.timerTimeoutId);
    this.timerFrameId = null;
    this.timerTimeoutId = null;
    this.timePaused = true;
  }

  /** Ms since timer start. */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /** Writes time into counter text node, no change detection. */
  renderTime(elapsed: number): void {
    this.formattedTime = this.formatTime(elapsed);
    const textNode = this.counterRef?.nativeElement.firstChild;
    if (textNode) {
      textNode.nodeValue = this.formattedTime;
    }
  }

  /** Time up: stops timer, submits without answer. */
  handleTimeout(): void {
    this.stopTimer();

    if (this.selectedAnswerIdx == null) {
      this.sendResponse(null, this.timeLimit());
    }
  }

  /** Resets answer + timer state for next question. */
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

  /** Current question's time limit in ms (fallback 10 s). */
  timeLimit(): number {
    return this.currentQuestion?.question?.time || this.DEFAULT_TIME_LIMIT;
  }

  /** Sets displayed time, re-renders. */
  buildFormattedTime(elapsed: number): void {
    this.formattedTime = this.formatTime(elapsed);
    this.cdr.detectChanges();
  }

  /** Formats ms as `ss.mmm`, capped at time limit. */
  formatTime(elapsed: number): string {
    const capped = Math.floor(Math.min(Math.max(0, elapsed), this.timeLimit()));
    const seconds = Math.floor(capped / 1000);
    const milliseconds = capped % 1000;
    return `${this.pad(seconds)}.${this.pad(milliseconds, 3)}`;
  }

  /** Loads + decodes image, waits max. 400 ms. */
  async preloadImage(url: string | null): Promise<void> {
    if (!url) return;

    const img = new Image();
    img.src = url;

    const timeout = new Promise<void>(resolve => setTimeout(resolve, this.IMAGE_PRELOAD_TIMEOUT));
    await Promise.race([img.decode().catch(() => undefined), timeout]);
  }

  /** Builds `/finish/` payload. */
  buildQuestionFinish(answer: Interfaces.Answer | null, time: number): Models.QuestionFinishModel {
    return new Models.QuestionFinishModel({
      response_id: this.currentQuestion?.response_id ?? 0,
      answer_id: answer?.id ?? null,
      time
    });
  }

  /** Stored player name. */
  getPlayer(): string {
    return this.storage.getString('QuizStrike_player');
  }

  /** Stored running quiz id. */
  getQuiz(): number {
    return this.storage.getNumber('QuizStrike_runningQuizId');
  }

  /** Open questions as text for start screen. */
  getRemainingQuestionsCount(): string {
    if (!this.game) return '';
    return String(this.game.total_questions - this.game.answered_questions);
  }

  /** Left-pads number with zeros. */
  pad(num: number, size: number = 2): string {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }

  /** Question image URL, falls back to category image. */
  imageUrl(question: Interfaces.QuestionStart | null): string | null {
    const image = question?.question?.image || question?.question?.category?.image;
    return image ? this.rest.getBaseUrl() + image : null;
  }

  /** CSS `background-image` value for question. */
  background(question: Interfaces.QuestionStart | null): string {
    const url = this.imageUrl(question);
    return url ? `url(${url})` : 'none';
  }

  /** True while flipping or timer running. */
  inProgress(): boolean {
    return this.timerActive && (this.isFlipping || this.timeRunning);
  }

  /** Stops timer on leave. */
  ngOnDestroy(): void {
    this.stopTimer();
  }

}
