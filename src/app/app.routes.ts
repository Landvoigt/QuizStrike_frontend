import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { MenuComponent } from './menu/menu';
import { QuizComponent } from './quiz/quiz';
import { GameComponent } from './game/game';
import { GameService } from './services/game.service';

export const routes: Routes = [
    { path: '', component: MenuComponent, pathMatch: 'full', canActivate: [() => inject(GameService).runningGameRedirect()] },
    { path: 'menu', redirectTo: '' },

    { path: 'quiz/:id', component: QuizComponent, canActivate: [() => inject(GameService).runningGameRedirect()] },
    { path: 'quiz/:id/play', component: GameComponent },
    { path: 'quiz/:id/score', loadComponent: () => import('./score/score').then(m => m.ScoreComponent), canActivate: [() => inject(GameService).runningGameRedirect()] },

    { path: 'privacy', loadComponent: () => import('./privacy/privacy').then(m => m.PrivacyComponent) },

    { path: '**', redirectTo: '' },
];
