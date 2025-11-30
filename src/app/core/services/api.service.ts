import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  private async getHeaders(): Promise<HttpHeaders> {
    const token = await this.storageService.get('token');

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<Observable<T>> {
    const headers = await this.getHeaders();
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { headers })
      .pipe(catchError(this.handleError));
  }

  async post<T>(endpoint: string, data: any): Promise<Observable<T>> {
    const headers = await this.getHeaders();
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  async put<T>(endpoint: string, data: any): Promise<Observable<T>> {
    const headers = await this.getHeaders();
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  async delete<T>(endpoint: string): Promise<Observable<T>> {
    const headers = await this.getHeaders();
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }

    console.error('Error en API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

}
