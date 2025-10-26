import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quiz } from '../interfaces/quiz.interface';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  private readonly apiBaseUrl: string = environment.API_BASE_URL;

    constructor(private http: HttpClient) { }

    getQuiz(): Observable<Quiz[]> {
        return this.http.get<Quiz[]>(`${this.apiBaseUrl}quiz/`);
    }

    saveResponse(response: Response): Observable<any> {
        return this.http.post(`${this.apiBaseUrl}response/`, response);
    }

}
