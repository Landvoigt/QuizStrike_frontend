import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import * as Interfaces from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new BehaviorSubject<Interfaces.Alert | null>(null);

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

  /** Emits alert, clears it after 4 s. */
  show(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertSubject.next({ message, type });
    setTimeout(() => {
      this.alertSubject.next(null);
    }, 4000);
  }

  /** Clears current alert. */
  clearAlert() {
    this.alertSubject.next(null);
  }
}
