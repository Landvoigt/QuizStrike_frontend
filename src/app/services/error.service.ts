import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import * as Sentry from '@sentry/angular';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  readonly UNEXPECTED_ERROR: string = 'Unexpected error occurred. Please try again later';
  readonly NAME_TAKEN: string = 'This name is already taken. Please choose a different name.';
  readonly INVALID_TOKEN: string = 'Your session is invalid. Please enter your name again.';
  readonly GAME_FINISHED: string = 'Game already finished!';
  readonly INVALID_NAME: string = 'Invalid name or quiz. Please try again.';
  readonly QUIZ_UNAVAILABLE: string = 'This quiz is no longer available.';
  readonly TOO_MANY_PLAYERS: string = 'Too many new players from this network. Please try again';

  constructor(private alert: AlertService) { }

  /** Shows error alert: string, API `error`/`detail`, or generic fallback. */
  handleError(error: any): void {
    this.log(error);

    let errMsg: string | undefined;

    if (typeof error === 'string') {
      errMsg = error;
    } else if (typeof error?.error?.error === 'string') {
      errMsg = error.error.error;
    } else if (typeof error?.error?.detail === 'string') {
      errMsg = error.error.detail;
    }

    this.alert.showError(errMsg ?? this.UNEXPECTED_ERROR);
  }

  /** Rate-limit message with wait time from `retry_after` (s). */
  tooManyPlayers(retryAfter: unknown): string {
    if (typeof retryAfter !== 'number' || retryAfter <= 0) {
      return `${this.TOO_MANY_PLAYERS} later.`;
    }
    return `${this.TOO_MANY_PLAYERS} in about ${this.formatWait(retryAfter)}.`;
  }

  /** Seconds as rounded-up minutes (< 1 h) or hours. */
  private formatWait(seconds: number): string {
    if (seconds < 3600) {
      const minutes = Math.max(1, Math.ceil(seconds / 60));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    const hours = Math.ceil(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  /** 5xx/network → console.error + Sentry; other HTTP errors → warn only. */
  private log(error: any): void {
    if (!(error instanceof HttpErrorResponse)) return;

    if (error.status === 0 || error.status >= 500) {
      console.error(error);
      Sentry.captureException(error);
    } else {
      console.warn(`HTTP ${error.status}: ${error.url}`);
    }
  }

}
