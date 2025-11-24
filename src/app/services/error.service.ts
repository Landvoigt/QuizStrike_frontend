import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private alert: AlertService) { }

  handleError(error: any): void {
    const errMsg = error?.error?.error ?? error?.error?.detail;

    if (typeof errMsg === 'string') {
      this.alert.showError(errMsg);
    } else {
      this.alert.showError("Unexpected error occurred. Please try again later");
    }
  }

}
