import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Emotion,
  EmotionTag,
  MoodEntry,
  CreateMoodEntryRequest,
  UpdateMoodEntryRequest,
  MoodTrends,
  WeeklyMoodScore,
  ApiMoodResponse
} from '../models/mood.model';

@Injectable({
  providedIn: 'root'
})
export class MoodService {
  private emotionsSubject = new BehaviorSubject<Emotion[]>([]);
  public emotions$ = this.emotionsSubject.asObservable();

  private tagsSubject = new BehaviorSubject<EmotionTag[]>([]);
  public tags$ = this.tagsSubject.asObservable();

  private moodEntriesSubject = new BehaviorSubject<MoodEntry[]>([]);
  public moodEntries$ = this.moodEntriesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadEmotions();
    this.loadTags();
  }

  // Cargar emociones
  async loadEmotions() {
    try {
      const request = await this.apiService.get<ApiMoodResponse<{ emotions: Emotion[] }>>('/mood/emotions');

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.emotionsSubject.next(response.data.emotions);
          }
        },
        error: (error) => {
          console.error('Error al cargar emociones:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar emociones:', error);
    }
  }

  // Cargar etiquetas
  async loadTags() {
    try {
      const request = await this.apiService.get<ApiMoodResponse<{ tags: EmotionTag[] }>>('/mood/tags');

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tagsSubject.next(response.data.tags);
          }
        },
        error: (error) => {
          console.error('Error al cargar etiquetas:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar etiquetas:', error);
    }
  }

  // RF-06 y RF-07: Crear registro emocional
  async createMoodEntry(entryData: CreateMoodEntryRequest): Promise<Observable<ApiMoodResponse>> {
    const request = await this.apiService.post<ApiMoodResponse>('/mood/entries', entryData);

    return request.pipe(
      tap(() => {
        this.loadMoodEntries();
      })
    );
  }

  // RF-08: Cargar registros emocionales
  async loadMoodEntries(filters?: {
    start_date?: string;
    end_date?: string;
    emotion_id?: number;
    tag_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<void> {
    try {
      let endpoint = '/mood/entries';

      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
        endpoint += `?${params.toString()}`;
      }

      const request = await this.apiService.get<ApiMoodResponse<{ entries: MoodEntry[] }>>(endpoint);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.moodEntriesSubject.next(response.data.entries);
          }
        },
        error: (error) => {
          console.error('Error al cargar registros:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar registros:', error);
    }
  }

  // Obtener un registro específico
  async getMoodEntryById(id: number): Promise<Observable<ApiMoodResponse<{ entry: MoodEntry }>>> {
    return await this.apiService.get<ApiMoodResponse<{ entry: MoodEntry }>>(`/mood/entries/${id}`);
  }

  // Actualizar registro emocional
  async updateMoodEntry(id: number, entryData: UpdateMoodEntryRequest): Promise<Observable<ApiMoodResponse>> {
    const request = await this.apiService.put<ApiMoodResponse>(`/mood/entries/${id}`, entryData);

    return request.pipe(
      tap(() => {
        this.loadMoodEntries();
      })
    );
  }

  // Eliminar registro emocional
  async deleteMoodEntry(id: number): Promise<Observable<ApiMoodResponse>> {
    const request = await this.apiService.delete<ApiMoodResponse>(`/mood/entries/${id}`);

    return request.pipe(
      tap(() => {
        this.loadMoodEntries();
      })
    );
  }

  // RF-09: Obtener tendencias emocionales
  async getMoodTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<Observable<ApiMoodResponse<MoodTrends>>> {
    return await this.apiService.get<ApiMoodResponse<MoodTrends>>(`/mood/trends?period=${period}`);
  }

  // RF-10: Obtener termómetro emocional
  async getWeeklyMoodScore(): Promise<Observable<ApiMoodResponse<WeeklyMoodScore>>> {
    return await this.apiService.get<ApiMoodResponse<WeeklyMoodScore>>('/mood/weekly-score');
  }

  // Obtener emociones actuales
  getEmotions(): Emotion[] {
    return this.emotionsSubject.value;
  }

  // Obtener etiquetas actuales
  getTags(): EmotionTag[] {
    return this.tagsSubject.value;
  }

  // Obtener registros actuales
  getMoodEntries(): MoodEntry[] {
    return this.moodEntriesSubject.value;
  }

  // Obtener emoción por ID
  getEmotionById(id: number): Emotion | undefined {
    return this.emotionsSubject.value.find(e => e.id === id);
  }

  // Obtener registro de hoy
  getTodayEntry(): MoodEntry | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.moodEntriesSubject.value.find(entry => entry.entry_date === today);
  }
}
