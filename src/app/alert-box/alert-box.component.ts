import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../services/alert.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-alert-box',
  imports: [CommonModule],
  templateUrl: './alert-box.component.html',
  styleUrl: './alert-box.component.scss',
})
export class AlertBoxComponent implements OnInit {
  message: string = '';
  type: 'success' | 'error' | 'info' | 'warning' = 'success';

  constructor(private cdr: ChangeDetectorRef, private alert: AlertService) { }

  ngOnInit(): void {
    this.alert.getAlert().subscribe((alert: Interfaces.Alert | null) => {
      if (alert) {
        this.message = alert.message;
        this.type = alert.type;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.close();
        }, 4000);
      } else {
        this.message = '';
        this.type = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  close() {
    this.message = '';
    this.cdr.detectChanges();
  }
}
