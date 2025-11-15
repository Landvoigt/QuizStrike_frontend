import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import * as Interfaces from '../interfaces';
import * as Models from '../models';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  private readonly apiBaseUrl: string = environment.API_BASE_URL;

  constructor(private http: HttpClient) { }

  getQuizzes(): Observable<Interfaces.Quiz[]> {
    return this.http.get<Interfaces.Quiz[]>(`${this.apiBaseUrl}quiz/`);
  }

  getScores(): Observable<Interfaces.Score[]> {
    return this.http.get<Interfaces.Score[]>(`${this.apiBaseUrl}score/`);
  }

  getGame(data: { name: string; quizId: number | null }): Observable<Interfaces.Game> {
    return this.http.post<Interfaces.Game>(`${this.apiBaseUrl}player/`, data);
  }

  startResponse(response: Models.ResponseStartModel): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}start/`, response);
  }

  finishResponse(response: Models.ResponseFinishModel): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}finish/`, response);
  }

}
