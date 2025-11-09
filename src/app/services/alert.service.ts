import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Alert } from '../interfaces/alert.interface';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new BehaviorSubject<Alert | null>(null);

  getAlert(): Observable<Alert | null> {
    return this.alertSubject.asObservable();
  }

  showAlert(alert: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.show(alert, type);
  }

  showError(error: string): void {
    this.show(error, 'error');
  }

  show(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertSubject.next({ message, type });
    setTimeout(() => {
      this.alertSubject.next(null);
    }, 5000);
  }

  clearAlert() {
    this.alertSubject.next(null);
  }
}
