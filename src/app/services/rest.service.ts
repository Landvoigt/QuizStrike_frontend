import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quiz, Score } from '../interfaces/quiz.interface';

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

  saveResponse(response: Response): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}response/`, response);
  }

}
