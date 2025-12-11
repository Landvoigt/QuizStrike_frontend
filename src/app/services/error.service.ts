import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private alert: AlertService) { }

  handleError(error: any): void {
    let errMsg: string | undefined;

    if (typeof error === 'string') {
      errMsg = error;
    } else if (typeof error?.error?.error === 'string') {
      errMsg = error.error.error;
    } else if (typeof error?.error?.detail === 'string') {
      errMsg = error.error.detail;
    }

    if (errMsg) {
      this.alert.showError(errMsg);
    } else {
      this.alert.showError("Unexpected error occurred. Please try again later");
    }
  }

}
