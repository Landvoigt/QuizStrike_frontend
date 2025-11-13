import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game, Quiz, Score, ResponseModel } from '../interfaces/quiz.interface';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  private readonly apiBaseUrl: string = environment.API_BASE_URL;

  constructor(private http: HttpClient) { }

  getQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.apiBaseUrl}quiz/`);
  }

  getScores(): Observable<Score[]> {
    return this.http.get<Score[]>(`${this.apiBaseUrl}score/`);
  }

  getGame(data: { name: string; quizId: number | null }): Observable<Game> {
    return this.http.post<Game>(`${this.apiBaseUrl}player/`, data);
  }

  saveResponse(response: ResponseModel): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}response/`, response);
  }

}
