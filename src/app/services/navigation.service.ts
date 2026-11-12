import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Location } from '@angular/common'
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  activePage: string | null = 'menu';

  constructor(private router: Router, private locate: Location) {
    this.setupActivePageListener();
  }

  /** Sets `activePage` from first URL segment. */
  private setActivePageFromUrl(url: string): void {
    const match = url.match(/\/([^\/#?]+)/);
    this.activePage = match ? match[1] : null;
  }

  /** Tracks active page on navigation. */
  setupActivePageListener() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd))
      .subscribe((event: any) => this.setActivePageFromUrl(event.url));
  }

  /** True if page is active. */
  pageIs(page: string): boolean {
    return this.activePage === page;
  }

  /** Browser back. */
  back() {
    this.locate.back();
  }

  /** True while on a game page. */
  isPlaying(): boolean {
    return this.router.url.endsWith('/play');
  }

  /** Opens quiz overview. */
  menu() {
    this.router.navigate(['']);
  }

  /** Opens quiz page. */
  quiz(quizId: number) {
    this.router.navigate(['quiz', quizId]);
  }

  /** Opens game of quiz. */
  game(quizId: number) {
    this.router.navigate(['quiz', quizId, 'play']);
  }

  /** Opens scoreboard of quiz. */
  score(quizId: number) {
    this.router.navigate(['quiz', quizId, 'score']);
  }

  /** Opens privacy page. */
  privacy() {
    this.router.navigate(['privacy']);
  }

  /** Opens error page with params. */
  error(params: any) {
    this.router.navigate(['/error'], params);
  }

}
