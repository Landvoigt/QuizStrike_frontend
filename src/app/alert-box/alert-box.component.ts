import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../services/alert.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-alert-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-box.component.html',
  styleUrl: './alert-box.component.scss',
})

export class AlertBoxComponent {
  message: string = '';
  type: 'success' | 'error' | 'info' | 'warning' = 'info';

  constructor(private alert: AlertService) { }

  ngOnInit(): void {
    this.alert.getAlert().subscribe((alert: Interfaces.Alert | null) => {
      if (alert) {
        this.message = alert.message;
        this.type = alert.type;
        setTimeout(() => {
          this.close();
        }, 5000);
      } else {
        this.message = '';
        this.type = 'info';
      }
    });
  }

  close() {
    this.message = '';
  }
}
