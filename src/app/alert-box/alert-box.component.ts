import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../services/alert.service';

import * as Interfaces from '../interfaces';

@Component({
  selector: 'app-alert-box',
  imports: [CommonModule],
  templateUrl: './alert-box.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-box.component.scss',
})
export class AlertBoxComponent implements OnInit {
  message: string = '';
  type: 'success' | 'error' | 'info' | 'warning' = 'success';

  constructor(private cdr: ChangeDetectorRef, private alert: AlertService) { }

  /** Shows incoming alerts; service clears them. */
  ngOnInit(): void {
    this.alert.getAlert().subscribe((alert: Interfaces.Alert | null) => {
      this.message = alert?.message ?? '';
      this.type = alert?.type ?? 'error';
      this.cdr.detectChanges();
    });
  }

  /** Hides alert. */
  close() {
    this.alert.clearAlert();
  }
}
