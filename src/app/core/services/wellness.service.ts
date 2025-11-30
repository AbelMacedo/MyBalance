import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  WellnessCategory,
  WellnessTip,
  Challenge,
  UserChallenge,
  Achievement,
  UserPoints,
  ApiWellnessResponse
} from '../models/wellness.model';

@Injectable({
  providedIn: 'root'
})
export class WellnessService {
  private categoriesSubject = new BehaviorSubject<WellnessCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private tipsSubject = new BehaviorSubject<WellnessTip[]>([]);
  public tips$ = this.tipsSubject.asObservable();

  private challengesSubject = new BehaviorSubject<Challenge[]>([]);
  public challenges$ = this.challengesSubject.asObservable();

  private userChallengesSubject = new BehaviorSubject<UserChallenge[]>([]);
  public userChallenges$ = this.userChallengesSubject.asObservable();

  private achievementsSubject = new BehaviorSubject<Achievement[]>([]);
  public achievements$ = this.achievementsSubject.asObservable();

  private userPointsSubject = new BehaviorSubject<UserPoints | null>(null);
  public userPoints$ = this.userPointsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadCategories();
  }

  // Cargar categorías
  async loadCategories() {
    try {
      const request = await this.apiService.get<ApiWellnessResponse<{ categories: WellnessCategory[] }>>('/wellness/categories');

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categoriesSubject.next(response.data.categories);
          }
        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Obtener consejos
  async getTips(
    categoryId?: number,
    difficulty?: string,
    limit: number = 10
  ): Promise<Observable<ApiWellnessResponse<{ tips: WellnessTip[] }>>> {

    let endpoint = `/wellness/tips?limit=${limit}`;

    if (categoryId) endpoint += `&category_id=${categoryId}`;
    if (difficulty) endpoint += `&difficulty=${difficulty}`;

    return this.apiService.get<ApiWellnessResponse<{ tips: WellnessTip[] }>>(endpoint);
  }


  // Consejo del día
  async getDailyTip(): Promise<Observable<ApiWellnessResponse<{ tip: WellnessTip }>>> {
    return await this.apiService.get<ApiWellnessResponse<{ tip: WellnessTip }>>('/wellness/tips/daily');
  }

  // Obtener retos disponibles
  async loadChallenges(filters?: { category_id?: number; type?: string; difficulty?: string }): Promise<void> {
    try {
      let endpoint = '/challenges';

      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
      }

      const request = await this.apiService.get<ApiWellnessResponse<{ challenges: Challenge[] }>>(endpoint);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.challengesSubject.next(response.data.challenges);
          }
        },
        error: (error) => {
          console.error('Error al cargar retos:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Unirse a un reto
  async joinChallenge(challengeId: number): Promise<Observable<ApiWellnessResponse>> {
    const request = await this.apiService.post<ApiWellnessResponse>('/challenges/join', { challenge_id: challengeId });

    return request.pipe(
      tap(() => {
        this.loadUserChallenges();
      })
    );
  }

  // Obtener retos del usuario
  async loadUserChallenges(isCompleted?: boolean): Promise<void> {
    try {
      let endpoint = '/challenges/user';

      if (isCompleted !== undefined) {
        endpoint += `?is_completed=${isCompleted}`;
      }

      const request = await this.apiService.get<ApiWellnessResponse<{ challenges: UserChallenge[] }>>(endpoint);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.userChallengesSubject.next(response.data.challenges);
          }
        },
        error: (error) => {
          console.error('Error al cargar retos del usuario:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Actualizar progreso del reto
  async updateChallengeProgress(
    userChallengeId: number,
    data: { progress_date?: string; is_completed: boolean; notes?: string }
  ): Promise<Observable<ApiWellnessResponse>> {
    const request = await this.apiService.put<ApiWellnessResponse>(
      `/challenges/${userChallengeId}/progress`,
      data
    );

    return request.pipe(
      tap(() => {
        this.loadUserChallenges();
      })
    );
  }

  // Abandonar reto
  async abandonChallenge(userChallengeId: number): Promise<Observable<ApiWellnessResponse>> {
    const request = await this.apiService.delete<ApiWellnessResponse>(`/challenges/${userChallengeId}`);

    return request.pipe(
      tap(() => {
        this.loadUserChallenges();
      })
    );
  }

  // Obtener logros
  async loadAchievements(category?: string): Promise<void> {
    try {
      let endpoint = '/achievements';

      if (category) {
        endpoint += `?category=${category}`;
      }

      const request = await this.apiService.get<ApiWellnessResponse<{ achievements: Achievement[] }>>(endpoint);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.achievementsSubject.next(response.data.achievements);
          }
        },
        error: (error) => {
          console.error('Error al cargar logros:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Obtener puntos del usuario
  async loadUserPoints(): Promise<void> {
    try {
      const request = await this.apiService.get<ApiWellnessResponse<{ points: UserPoints }>>('/achievements/points');

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.userPointsSubject.next(response.data.points);
          }
        },
        error: (error) => {
          console.error('Error al cargar puntos:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Getters
  getCategories(): WellnessCategory[] {
    return this.categoriesSubject.value;
  }

  getChallenges(): Challenge[] {
    return this.challengesSubject.value;
  }

  getUserChallenges(): UserChallenge[] {
    return this.userChallengesSubject.value;
  }

  getAchievements(): Achievement[] {
    return this.achievementsSubject.value;
  }

  getUserPoints(): UserPoints | null {
    return this.userPointsSubject.value;
  }
}
