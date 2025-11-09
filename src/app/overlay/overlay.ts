import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-overlay',
  imports: [],
  templateUrl: './overlay.html',
  styleUrl: './overlay.scss',
})
export class Overlay implements OnInit {
  visible: boolean = true;
  currentIndex = -1;
  sequence = ['3', '2', '1', 'Go!'];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.startCountdown();
  }

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
