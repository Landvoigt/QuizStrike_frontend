import { Routes } from '@angular/router';
import { MenuComponent } from './menu/menu';
import { GameComponent } from './game/game';
import { ScoreComponent } from './score/score';

export const routes: Routes = [
    { path: '', redirectTo: 'menu', pathMatch: 'full' },

    { path: 'menu', component: MenuComponent },
    { path: 'game', component: GameComponent },
    { path: 'score', component: ScoreComponent },
    // { path: 'imprint', component: ImprintComponent },
    // { path: 'privacy', component: PrivacyComponent },

    { path: '**', redirectTo: 'menu' },
];
