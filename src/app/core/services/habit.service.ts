import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Habit,
  HabitCategory,
  CreateHabitRequest,
  UpdateHabitRequest,
  HabitCompletion,
  CompleteHabitRequest,
  HabitStats,
  ApiHabitResponse
} from '../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private habitsSubject = new BehaviorSubject<Habit[]>([]);
  public habits$ = this.habitsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<HabitCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadCategories();
  }

  // Cargar categorías
  async loadCategories() {
    try {
      const request = await this.apiService.get<ApiHabitResponse<{ categories: HabitCategory[] }>>('/habits/categories');

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
      console.error('Error al cargar categorías:', error);
    }
  }

  // RF-01: Crear hábito
  async createHabit(habitData: CreateHabitRequest): Promise<Observable<ApiHabitResponse>> {
    const request = await this.apiService.post<ApiHabitResponse>('/habits', habitData);

    return request.pipe(
      tap(() => {
        this.loadHabits();
      })
    );
  }

  async loadHabits(isActive?: boolean): Promise<void> {
    try {
      const endpoint = isActive !== undefined
        ? `/habits?is_active=${isActive}`
        : '/habits';

      const request = await this.apiService.get<ApiHabitResponse<{ habits: Habit[] }>>(endpoint);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.habitsSubject.next(response.data.habits);
          }
        },
        error: (error) => {
          console.error('Error al cargar hábitos:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar hábitos:', error);
    }
  }

  async getHabitById(id: number): Promise<Observable<ApiHabitResponse<{ habit: Habit }>>> {
    return await this.apiService.get<ApiHabitResponse<{ habit: Habit }>>(`/habits/${id}`);
  }

  async updateHabit(id: number, habitData: UpdateHabitRequest): Promise<Observable<ApiHabitResponse>> {
    const request = await this.apiService.put<ApiHabitResponse>(`/habits/${id}`, habitData);

    return request.pipe(
      tap(() => {
        this.loadHabits();
      })
    );
  }

  async deleteHabit(id: number, preserveHistory: boolean = false): Promise<Observable<ApiHabitResponse>> {
    const endpoint = `/habits/${id}?preserve_history=${preserveHistory}`;
    const request = await this.apiService.delete<ApiHabitResponse>(endpoint);

    return request.pipe(
      tap(() => {
        this.loadHabits();
      })
    );
  }

  async togglePauseHabit(id: number): Promise<Observable<ApiHabitResponse>> {
    const request = await this.apiService.put<ApiHabitResponse>(`/habits/${id}/toggle-pause`, {});

    return request.pipe(
      tap(() => {
        this.loadHabits();
      })
    );
  }

  async completeHabit(completionData: CompleteHabitRequest): Promise<Observable<ApiHabitResponse>> {
    const request = await this.apiService.post<ApiHabitResponse>('/habits/completions', completionData);

    return request.pipe(
      tap(() => {
        this.loadHabits();
      })
    );
  }

  async getHabitCompletions(
    habitId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Observable<ApiHabitResponse<{ completions: HabitCompletion[] }>>> {
    let endpoint = `/habits/${habitId}/completions`;
    const params: string[] = [];

    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }

    return await this.apiService.get<ApiHabitResponse<{ completions: HabitCompletion[] }>>(endpoint);
  }

  async getHabitStats(
    habitId: number,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<Observable<ApiHabitResponse<HabitStats>>> {
    return await this.apiService.get<ApiHabitResponse<HabitStats>>(`/habits/${habitId}/stats?period=${period}`);
  }

  getTodayHabits(): Habit[] {
    // Obtener el día de la semana en inglés, luego convertir a minúsculas
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // 'monday', 'tuesday', etc.
    const allHabits = this.habitsSubject.value;

    return allHabits.filter(habit => {
      if (!habit.is_active || habit.is_paused) return false;

      if (habit.frequency === 'daily') return true;

      if (habit.frequency === 'specific_days' && habit.specific_days) {
        return habit.specific_days.includes(today);
      }

      return false;
    });
  }

  getHabits(): Habit[] {
    return this.habitsSubject.value;
  }

  getCategories(): HabitCategory[] {
    return this.categoriesSubject.value;
  }
}
