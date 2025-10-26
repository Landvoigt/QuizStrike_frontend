import { Routes } from '@angular/router';
import { Menu } from './menu/menu';
import { Game } from './game/game';
import { Score } from './score/score';

export const routes: Routes = [
    { path: '', redirectTo: 'menu', pathMatch: 'full' },

    { path: 'menu', component: Menu },
    { path: 'game', component: Game },
    { path: 'score', component: Score },

    { path: '**', redirectTo: 'menu' },
];
