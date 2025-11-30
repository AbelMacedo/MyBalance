import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  DailyBalance,
  CreateBalanceRequest,
  BalanceHistory,
  ApiTaskResponse
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private balancesSubject = new BehaviorSubject<DailyBalance[]>([]);
  public balances$ = this.balancesSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // RF-14: Guardar balance diario
  async saveDailyBalance(balanceData: CreateBalanceRequest): Promise<Observable<ApiTaskResponse>> {
    const request = await this.apiService.post<ApiTaskResponse>('/balance', balanceData);

    return request.pipe(
      tap(() => {
        this.loadBalanceHistory();
      })
    );
  }

  // Obtener balance de una fecha
  async getBalanceByDate(date: string): Promise<Observable<ApiTaskResponse<{ balance: DailyBalance }>>> {
    return await this.apiService.get<ApiTaskResponse<{ balance: DailyBalance }>>(`/balance/${date}`);
  }

  // Obtener historial de balances
  async loadBalanceHistory(startDate?: string, endDate?: string, limit: number = 30): Promise<void> {
    try {
      let endpoint = '/balance/history';
      const params = new URLSearchParams();

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', limit.toString());

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const request = await this.apiService.get<ApiTaskResponse<BalanceHistory>>(endpoint);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.balancesSubject.next(response.data.balances);
          }
        },
        error: (error) => {
          console.error('Error al cargar balances:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar balances:', error);
    }
  }

  // Eliminar balance
  async deleteBalance(date: string): Promise<Observable<ApiTaskResponse>> {
    const request = await this.apiService.delete<ApiTaskResponse>(`/balance/${date}`);

    return request.pipe(
      tap(() => {
        this.loadBalanceHistory();
      })
    );
  }

  // Obtener balance de hoy
  async getTodayBalance(): Promise<Observable<ApiTaskResponse<{ balance: DailyBalance }>>> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getBalanceByDate(today);
  }

  // Verificar si existe balance de hoy
  async hasTodayBalance(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const request = await this.getBalanceByDate(today);

      return new Promise((resolve) => {
        request.subscribe({
          next: (response) => resolve(response.success),
          error: () => resolve(false)
        });
      });
    } catch (error) {
      return false;
    }
  }

  // Obtener balances actuales
  getBalances(): DailyBalance[] {
    return this.balancesSubject.value;
  }
}
