import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import * as Interfaces from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new BehaviorSubject<Interfaces.Alert | null>(null);
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly DURATION: number = 4000;

  /** Stream of current alert (null = none). */
  getAlert(): Observable<Interfaces.Alert | null> {
    return this.alertSubject.asObservable();
  }

  /** Shows alert of given type. */
  showAlert(alert: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.show(alert, type);
  }

  /** Shows error alert. */
  showError(error: string): void {
    this.show(error, 'error');
  }

  /** Emits alert, replaces previous one; clears after 4 s. */
  show(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.cancelHide();
    this.alertSubject.next({ message, type });
    this.hideTimeoutId = setTimeout(() => this.clearAlert(), this.DURATION);
  }

  /** Clears current alert. */
  clearAlert() {
    this.cancelHide();
    this.alertSubject.next(null);
  }

  /** Stops pending auto-hide. */
  private cancelHide(): void {
    if (this.hideTimeoutId !== null) clearTimeout(this.hideTimeoutId);
    this.hideTimeoutId = null;
  }
}
