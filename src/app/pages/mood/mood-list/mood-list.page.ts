import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { MoodEntry, WeeklyMoodScore } from 'src/app/core/models/mood.model';
import { MoodService } from 'src/app/core/services/mood.service';


interface GroupedEntries {
  date: string;
  entries: MoodEntry[];
}

@Component({
  selector: 'app-mood-list',
  templateUrl: './mood-list.page.html',
  styleUrls: ['./mood-list.page.scss'],
  standalone: false
})

export class MoodListPage implements OnInit, OnDestroy {
  moodEntries: MoodEntry[] = [];
  groupedEntries: GroupedEntries[] = [];
  weeklyScore?: WeeklyMoodScore;
  filterPeriod: string = 'all';
  isLoading = true;

  private moodSubscription?: Subscription;

  constructor(
    private moodService: MoodService,
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadData();
    this.subscribeToMoodEntries();
  }

  ngOnDestroy() {
    if (this.moodSubscription) {
      this.moodSubscription.unsubscribe();
    }
  }

  async loadData() {
    this.isLoading = true;
    await this.loadMoodEntries();
    await this.loadWeeklyScore();
  }

  async loadMoodEntries() {
    const filters = this.getFiltersFromPeriod();
    await this.moodService.loadMoodEntries(filters);
  }

  async loadWeeklyScore() {
    try {
      const request = await this.moodService.getWeeklyMoodScore();

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.weeklyScore = response.data;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar score semanal:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }

  subscribeToMoodEntries() {
    this.moodSubscription = this.moodService.moodEntries$.subscribe(entries => {
      this.moodEntries = entries;
      this.groupEntriesByDate();
    });
  }

  getFiltersFromPeriod() {
    const today = new Date();
    let startDate: string | undefined;

    switch (this.filterPeriod) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        return { start_date: startDate, end_date: startDate };

      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        return { start_date: startDate };

      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        return { start_date: startDate };

      case 'all':
      default:
        return {};
    }
  }

  groupEntriesByDate() {
    const grouped: { [key: string]: MoodEntry[] } = {};

    this.moodEntries.forEach(entry => {
      const date = entry.entry_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });

    this.groupedEntries = Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        entries: grouped[date].sort((a, b) =>
          b.entry_time.localeCompare(a.entry_time)
        )
      }));
  }

  onFilterChange() {
    this.loadMoodEntries();
  }

  formatDateHeader(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Comparar solo fecha sin hora
    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) {
      return 'Hoy';
    } else if (dateOnly === yesterdayOnly) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getTrendIcon(): string {
    if (!this.weeklyScore) return 'remove-outline';

    switch (this.weeklyScore.trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove-outline';
      default: return 'remove-outline';
    }
  }

  getTrendColor(): string {
    if (!this.weeklyScore) return 'medium';

    switch (this.weeklyScore.trend) {
      case 'up': return 'success';
      case 'down': return 'danger';
      case 'stable': return 'warning';
      default: return 'medium';
    }
  }

  getScoreColor(): string {
    if (!this.weeklyScore) return 'rgba(255, 255, 255, 0.2)';

    const score = parseFloat(this.weeklyScore.current_week.score);

    if (score >= 4) return 'rgba(76, 175, 80, 0.3)'; // Verde
    if (score >= 3) return 'rgba(255, 235, 59, 0.3)'; // Amarillo
    return 'rgba(244, 67, 54, 0.3)'; // Rojo
  }

  async openOptionsMenu(entry: MoodEntry, event: Event) {
    event.stopPropagation();

    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Ver detalle',
          icon: 'eye',
          handler: () => {
            this.goToDetail(entry.id);
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.confirmDelete(entry);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async confirmDelete(entry: MoodEntry) {
    const alert = await this.alertController.create({
      header: 'Eliminar Registro',
      message: '¿Estás seguro de que deseas eliminar este registro emocional?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteEntry(entry.id);
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteEntry(entryId: number) {
    try {
      const request = await this.moodService.deleteMoodEntry(entryId);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessToast('Registro eliminado');
          }
        },
        error: (error) => {
          this.showErrorAlert(error.message);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  goToCreate() {
    this.router.navigate(['/mood/create']);
  }

  goToDetail(entryId: number) {
    this.router.navigate(['/mood/detail', entryId]);
  }

  goToStats() {
    this.router.navigate(['/mood/stats']);
  }

  async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // ✅ ahora sí permitido
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }


  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
