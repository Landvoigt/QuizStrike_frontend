import { Injectable } from '@angular/core';
import { Question, Quiz } from '../interfaces/quiz.interface';
import { RestService } from './rest.service';
import { ErrorService } from './error.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private quizzesSubject = new BehaviorSubject<Quiz[]>([]);
  quizzes$: Observable<Quiz[]> = this.quizzesSubject.asObservable();

  private selectedQuizSubject = new BehaviorSubject<Quiz | null>(null);
  selectedQuiz$: Observable<Quiz | null> = this.selectedQuizSubject.asObservable();

  constructor(private rest: RestService, private error: ErrorService) {
    this.initialize();
  }

  initialize(): void {
    this.getQuizzes();
  }

  private getQuizzes(): void {
    this.rest.getQuizzes().subscribe({
      next: (data) => {
        this.quizzesSubject.next(data);
        this.selectedQuizSubject.next(data[0]);
      },
      error: (err) => this.error.handleError(err)
    });
  }

}
