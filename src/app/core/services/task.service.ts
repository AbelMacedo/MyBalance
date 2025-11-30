import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Task,
  TaskCategory,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStats,
  ApiTaskResponse
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<TaskCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadCategories();
  }

  // Cargar categorías
  async loadCategories() {
    try {
      const request = await this.apiService.get<ApiTaskResponse<{ categories: TaskCategory[] }>>('/tasks/categories');

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

  // RF-11: Crear tarea
  async createTask(taskData: CreateTaskRequest): Promise<Observable<ApiTaskResponse>> {
    const request = await this.apiService.post<ApiTaskResponse>('/tasks', taskData);

    return request.pipe(
      tap(() => {
        this.loadTasks();
      })
    );
  }

  // Cargar tareas
  async loadTasks(filters?: {
    task_date?: string;
    is_completed?: boolean;
    category_id?: number;
  }): Promise<void> {
    try {
      let endpoint = '/tasks';

      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
        endpoint += `?${params.toString()}`;
      }

      const request = await this.apiService.get<ApiTaskResponse<{ tasks: Task[] }>>(endpoint);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tasksSubject.next(response.data.tasks);
          }
        },
        error: (error) => {
          console.error('Error al cargar tareas:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  // Obtener tarea por ID
  async getTaskById(id: number): Promise<Observable<ApiTaskResponse<{ task: Task }>>> {
    return await this.apiService.get<ApiTaskResponse<{ task: Task }>>(`/tasks/${id}`);
  }

  // RF-15: Actualizar tarea
  async updateTask(id: number, taskData: UpdateTaskRequest): Promise<Observable<ApiTaskResponse>> {
    const request = await this.apiService.put<ApiTaskResponse>(`/tasks/${id}`, taskData);

    return request.pipe(
      tap(() => {
        this.loadTasks();
      })
    );
  }

  // RF-12: Marcar como completada
  async toggleTaskComplete(id: number): Promise<Observable<ApiTaskResponse>> {
    const request = await this.apiService.put<ApiTaskResponse>(`/tasks/${id}/toggle-complete`, {});

    return request.pipe(
      tap(() => {
        this.loadTasks();
      })
    );
  }

  // RF-12: Posponer tarea
  async postponeTask(id: number, newDate: string): Promise<Observable<ApiTaskResponse>> {
    const request = await this.apiService.put<ApiTaskResponse>(`/tasks/${id}/postpone`, { new_date: newDate });

    return request.pipe(
      tap(() => {
        this.loadTasks();
      })
    );
  }

  // RF-15: Eliminar tarea
  async deleteTask(id: number): Promise<Observable<ApiTaskResponse>> {
    const request = await this.apiService.delete<ApiTaskResponse>(`/tasks/${id}`);

    return request.pipe(
      tap(() => {
        this.loadTasks();
      })
    );
  }

  // Obtener estadísticas
  async getTaskStats(startDate?: string, endDate?: string): Promise<Observable<ApiTaskResponse<TaskStats>>> {
    let endpoint = '/tasks/stats';

    if (startDate && endDate) {
      endpoint += `?start_date=${startDate}&end_date=${endDate}`;
    }

    return await this.apiService.get<ApiTaskResponse<TaskStats>>(endpoint);
  }

  // Obtener tareas del día
  getTodayTasks(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    return this.tasksSubject.value.filter(task => task.task_date === today);
  }

  // Obtener tareas actuales
  getTasks(): Task[] {
    return this.tasksSubject.value;
  }

  // Obtener categorías actuales
  getCategories(): TaskCategory[] {
    return this.categoriesSubject.value;
  }
}
