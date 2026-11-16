import { ChangeDetectorRef, Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-footer-component',
  imports: [],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit, OnDestroy {
  visible: boolean = false;

  private routeSub?: Subscription;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  readonly nav = inject(NavigationService);

  /** Shows footer on menu only, updates on navigation. */
  ngOnInit(): void {
    this.updateVisibility();
    this.routeSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateVisibility());
  }

  /** Visible only on quiz overview. */
  private updateVisibility(): void {
    this.visible = this.nav.isMenu();
    this.cdr.detectChanges();
  }

  /** Opens privacy page. */
  privacy(): void {
    this.nav.privacy();
  }

  /** Stops route listener. */
  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}
