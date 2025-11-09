import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private alert: AlertService) { }

  handleError(error: any): void {
    this.alert.showError(error);
  }

}
