import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { Habit, HabitCompletion, HabitStats } from 'src/app/core/models/habit.model';
import { HabitService } from 'src/app/core/services/habit.service';

@Component({
  selector: 'app-habit-detail',
  templateUrl: './habit-detail.page.html',
  styleUrls: ['./habit-detail.page.scss'],
  standalone: false
})
export class HabitDetailPage implements OnInit {
  habit?: Habit;
  stats?: HabitStats;
  completions: HabitCompletion[] = [];
  isLoading = true;
  selectedPeriod: 'week' | 'month' | 'year' = 'month';
  isCompletedToday = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) { }

  ngOnInit() {
    const habitId = this.route.snapshot.paramMap.get('id');
    if (habitId) {
      this.loadHabitData(parseInt(habitId));
    }
  }

  async loadHabitData(habitId: number) {
    this.isLoading = true;

    try {
      // Cargar hábito
      const habitRequest = await this.habitService.getHabitById(habitId);
      habitRequest.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.habit = response.data.habit;
            this.loadStats(habitId);
            this.loadCompletions(habitId);
          }
        },
        error: (error) => {
          console.error('Error al cargar hábito:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }

  async loadStats(habitId: number) {
    try {
      const statsRequest = await this.habitService.getHabitStats(habitId, this.selectedPeriod);
      statsRequest.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.stats = response.data;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }

  async loadCompletions(habitId: number) {
    try {
      const completionsRequest = await this.habitService.getHabitCompletions(habitId);
      completionsRequest.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.completions = response.data.completions;
            this.checkIfCompletedToday();
          }
        },
        error: (error) => {
          console.error('Error al cargar cumplimientos:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  checkIfCompletedToday() {
    const today = new Date().toISOString().split('T')[0];
    this.isCompletedToday = this.completions.some(
      c => c.completion_date === today && c.status === 'completed'
    );
  }

  async toggleComplete() {
    if (!this.habit) return;

    try {
      const request = await this.habitService.completeHabit({
        habit_id: this.habit.id,
        status: 'completed'
      });

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.isCompletedToday = true;
            this.showSuccessAlert();
            this.loadHabitData(this.habit!.id);
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

  onPeriodChange() {
    if (this.habit) {
      this.loadStats(this.habit.id);
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getFrequencyText(frequency: string): string {
    switch (frequency) {
      case 'daily': return 'Diario';
      case 'specific_days': return 'Días específicos';
      case 'weekly': return 'Semanal';
      default: return frequency;
    }
  }

  getFrequencyDetails(): string {
    if (!this.habit) return '';

    if (this.habit.frequency === 'daily') {
      return 'Todos los días';
    } else if (this.habit.frequency === 'specific_days' && this.habit.specific_days) {
      const days = this.habit.specific_days.map(d => this.translateDay(d)).join(', ');
      return days;
    } else if (this.habit.frequency === 'weekly') {
      return 'Una vez por semana';
    }

    return 'No definida';
  }

  translateDay(day: string): string {
    const days: any = {
      'monday': 'Lun',
      'tuesday': 'Mar',
      'wednesday': 'Mié',
      'thursday': 'Jue',
      'friday': 'Vie',
      'saturday': 'Sáb',
      'sunday': 'Dom'
    };
    return days[day] || day;
  }

  getCompletionRate(): number {
    if (!this.stats) return 0;

    const total = this.getDaysInPeriod();
    if (total === 0) return 0;

    return Math.min(this.stats.total_completions / total, 1);
  }

  getDaysInPeriod(): number {
    switch (this.selectedPeriod) {
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 30;
    }
  }

  getLast30Days(): Date[] {
    const days: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }

  isDayCompleted(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return this.completions.some(
      c => c.completion_date === dateStr && c.status === 'completed'
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  async openOptionsMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Editar',
          icon: 'create',
          handler: () => {
            this.goToEdit();
          }
        },
        {
          text: this.habit?.is_paused ? 'Reanudar' : 'Pausar',
          icon: this.habit?.is_paused ? 'play' : 'pause',
          handler: () => {
            this.togglePause();
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.confirmDelete();
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

  goToEdit() {
    if (this.habit) {
      this.router.navigate(['/habits/edit', this.habit.id]);
    }
  }

  async togglePause() {
    if (!this.habit) return;

    try {
      const request = await this.habitService.togglePauseHabit(this.habit.id);
      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.loadHabitData(this.habit!.id);
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

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: 'Eliminar Hábito',
      message: '¿Estás seguro de que deseas eliminar este hábito?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteHabit();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteHabit() {
    if (!this.habit) return;

    try {
      const request = await this.habitService.deleteHabit(this.habit.id, false);
      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/habits/list']);
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

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Felicidades! 🎉',
      message: 'Has completado tu hábito. ¡Sigue así!',
      buttons: ['OK']
    });

    await alert.present();
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
