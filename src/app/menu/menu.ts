import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../services/navigation.service';
import { RestService } from '../services/rest.service';
import { Game, Quiz } from '../interfaces/quiz.interface';
import { AsyncPipe } from '@angular/common';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-menu',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class MenuComponent implements OnInit {
  overlayVisible: boolean = false;
  showInput: boolean = false;

  game: Game | null = null;
  selectedQuiz: Quiz | null = null;

  playerName: string = '';

  constructor(public nav: NavigationService, private rest: RestService, public gameService: GameService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.tryRestorePlayer();
  }

  private tryRestorePlayer(): void {
    const storedName = localStorage.getItem('QuizStrike_player');
    const storedQuizId = localStorage.getItem('QuizStrike_runningQuizId');

    if (!storedName || !storedQuizId) return;
    this.playerName = storedName;
    this.selectedQuiz = null;

    this.gameService.game$.subscribe((game) => {
      if (!game) return;
      this.game = game;

      if (!this.selectedQuiz && game.quiz) {
        this.selectedQuiz = game.quiz;
      }

      this.cdr.detectChanges();
    });
  }

  selectQuiz(quiz: Quiz) {
    this.selectedQuiz = quiz;
    this.showInput = true;
  }

  register() {
    if (!this.playerName.trim()) return;

    this.rest.getGame({ name: this.playerName.trim(), quizId: this.selectedQuiz?.id ?? null })
      .subscribe((res: Game) => {
        console.log(res);
        this.gameService.setGame(res);
        this.game = res;
        this.showInput = false;
        this.cdr.detectChanges();

        localStorage.setItem('QuizStrike_player', this.playerName.trim());
        localStorage.setItem('QuizStrike_runningQuizId', this.game?.quiz.id.toString() ?? '');
      });
  }

  play() {
    if (this.game?.quiz_completed) {
      this.nav.menu();
      return;
    }

    setTimeout(() => {
      this.nav.game();
    }, 1000);
  }

}
