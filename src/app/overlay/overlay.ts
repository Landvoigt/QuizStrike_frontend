import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-overlay',
  imports: [],
  templateUrl: './overlay.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './overlay.scss',
})
export class Overlay implements OnInit {
  visible: boolean = true;
  currentIndex = -1;
  sequence = ['3', '2', '1', 'Go!'];

  constructor(private cdr: ChangeDetectorRef) { }

  /** Starts countdown. */
  ngOnInit(): void {
    this.startCountdown();
  }

  /** Shows 3-2-1-Go (1 s each), then hides overlay. */
  startCountdown(): void {
    const showNext = () => {
      this.currentIndex++;
      this.cdr.detectChanges();

      if (this.currentIndex >= this.sequence.length) {
        setTimeout(() => {
          this.visible = false;
          this.cdr.detectChanges();
        }, 800);
        return;
      }

      setTimeout(showNext, 1000);
    };

    showNext();
  }

}
