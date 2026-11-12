import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import * as Interfaces from '../interfaces';
import * as Models from '../models';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  private readonly PLAYER_TOKEN_HEADER: string = 'X-Player-Token';
  private readonly baseUrl: string = environment.BASE_URL;
  private readonly apiBaseUrl: string = environment.API_BASE_URL;

  constructor(private http: HttpClient) { }

  /** Backend base URL (for media). */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** GET active quizzes. */
  getQuizzes(): Observable<Interfaces.Quiz[]> {
    return this.http.get<Interfaces.Quiz[]>(`${this.apiBaseUrl}/quiz/`);
  }

  /** GET scores. */
  getScores(): Observable<Interfaces.Score[]> {
    return this.http.get<Interfaces.Score[]>(`${this.apiBaseUrl}/score/`);
  }

  /** POST `/player/`: joins quiz; existing token keeps name ours. */
  getGame(data: { name: string; quizId: number | null }, token?: string | null): Observable<Interfaces.Game> {
    return this.http.post<Interfaces.Game>(`${this.apiBaseUrl}/player/`, data, { headers: this.tokenHeaders(token) });
  }

  /** POST `/start/`: next question, starts server timer. */
  startQuestion(response: Models.QuestionStartModel, token: string | null): Observable<Interfaces.QuestionStart> {
    return this.http.post<Interfaces.QuestionStart>(`${this.apiBaseUrl}/start/`, response, { headers: this.tokenHeaders(token) });
  }

  /** POST `/finish/`: submits answer, returns result. */
  finishQuestion(response: Models.QuestionFinishModel, token: string | null): Observable<Interfaces.QuestionFinishResult> {
    return this.http.post<Interfaces.QuestionFinishResult>(`${this.apiBaseUrl}/finish/`, response, { headers: this.tokenHeaders(token) });
  }

  /** Headers with `X-Player-Token` if token given. */
  private tokenHeaders(token?: string | null): HttpHeaders {
    let headers = new HttpHeaders();
    if (token) headers = headers.set(this.PLAYER_TOKEN_HEADER, token);
    return headers;
  }

}
