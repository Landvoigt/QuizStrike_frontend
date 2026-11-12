import { Routes } from '@angular/router';
import { MenuComponent } from './menu/menu';
import { GameComponent } from './game/game';

export const routes: Routes = [
    { path: '', redirectTo: 'menu', pathMatch: 'full' },

    { path: 'menu', component: MenuComponent },
    { path: 'game', component: GameComponent },

    { path: 'score', loadComponent: () => import('./score/score').then(m => m.ScoreComponent) },
    { path: 'privacy', loadComponent: () => import('./privacy/privacy').then(m => m.PrivacyComponent) },

    { path: '**', redirectTo: 'menu' },
];
