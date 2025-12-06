import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Location } from '@angular/common'
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  activePage: string | null = 'home';

  constructor(private router: Router, private locate: Location) {
    this.setupActivePageListener();
  }

  private setActivePageFromUrl(url: string): void {
    const match = url.match(/\/([^\/#?]+)/);
    this.activePage = match ? match[1] : null;
  }

  setupActivePageListener() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd))
      .subscribe((event: any) => this.setActivePageFromUrl(event.url));
  }

  pageIs(page: string): boolean {
    return this.activePage === page;
  }

  back() {
    this.locate.back();
  }

  menu() {
    this.router.navigate(['menu']);
  }

  game() {
    this.router.navigate(['game']);
  }

  score() {
    this.router.navigate(['score']);
  }

  imprint() {
    this.router.navigate(['imprint']);
  }

  privacy() {
    this.router.navigate(['privacy']);
  }

  error(params: any) {
    this.router.navigate(['/error'], params);
  }

}
