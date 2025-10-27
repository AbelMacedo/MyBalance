import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private async loadStoredUser() {
    const token = await this.storageService.get('token');
    const user = await this.storageService.get('user');

    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  async register(data: RegisterRequest): Promise<Observable<AuthResponse>> {
    const request = await this.apiService.post<AuthResponse>('/auth/register', data);

    return request.pipe(
      tap(async (response) => {
        if (response.success && response.data) {
          await this.saveAuthData(response.data.user, response.data.token);
        }
      })
    );
  }

  async login(credentials: LoginRequest): Promise<Observable<AuthResponse>> {
    const request = await this.apiService.post<AuthResponse>('/auth/login', credentials);

    return request.pipe(
      tap(async (response) => {
        if (response.success && response.data) {
          await this.saveAuthData(response.data.user, response.data.token);
        }
      })
    );
  }

  async logout() {
    await this.storageService.remove('token');
    await this.storageService.remove('user');

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    this.router.navigate(['/login']);
  }

  private async saveAuthData(user: User, token: string) {
    await this.storageService.set('token', token);
    await this.storageService.set('user', user);

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.storageService.get('token');
    return !!token;
  }

  async requestPasswordReset(email: string): Promise<Observable<AuthResponse>> {
    return await this.apiService.post<AuthResponse>('/auth/request-password-reset', { email });
  }

  async resetPassword(token: string, newPassword: string, confirmation: string): Promise<Observable<AuthResponse>> {
    return await this.apiService.post<AuthResponse>('/auth/reset-password', {
      token,
      new_password: newPassword,
      new_password_confirmation: confirmation
    });
  }

  async getProfile(): Promise<Observable<any>> {
    return await this.apiService.get('/user/profile');
  }

  async updateProfile(data: Partial<User>): Promise<Observable<any>> {
    const request = await this.apiService.put('/user/profile', data);

    return request.pipe(
      tap(async (response: any) => {
        if (response.success) {
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, ...data };
            await this.storageService.set('user', updatedUser);
            this.currentUserSubject.next(updatedUser);
          }
        }
      })
    );
  }

  async deleteAccount(password: string): Promise<Observable<any>> {
    const request = await this.apiService.delete('/user/account');

    return request.pipe(
      tap(async (response: any) => {
        if (response.success) {
          await this.logout();
        }
      })
    );
  }
}
