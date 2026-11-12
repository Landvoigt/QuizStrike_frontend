import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  readonly UNEXPECTED_ERROR: string = 'Unexpected error occurred. Please try again later';
  readonly NAME_TAKEN: string = 'This name is already taken. Please choose a different name.';
  readonly INVALID_TOKEN: string = 'Your session is invalid. Please enter your name again.';
  readonly GAME_FINISHED: string = 'Game already finished!';

  constructor(private alert: AlertService) { }

  /** Shows error alert: string, API `error`/`detail`, or generic fallback. */
  handleError(error: any): void {
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

}
