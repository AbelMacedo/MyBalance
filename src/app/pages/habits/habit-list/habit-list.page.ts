import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Habit } from 'src/app/core/models/habit.model';
import { HabitService } from 'src/app/core/services/habit.service';

@Component({
  selector: 'app-habit-list',
  templateUrl: './habit-list.page.html',
  styleUrls: ['./habit-list.page.scss'],
  standalone: false
})
export class HabitListPage implements OnInit, OnDestroy {
  habits: Habit[] = [];
  filteredHabits: Habit[] = [];
  filterSegment: string = 'all';
  isLoading = true;
  completedToday = 0;
  completionPercentage = 0;

  private habitsSubscription?: Subscription;
  private completedHabitsToday: Set<number> = new Set();

  constructor(
    private habitService: HabitService,
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadHabits();
    this.subscribeToHabits();
  }

  ngOnDestroy() {
    if (this.habitsSubscription) {
      this.habitsSubscription.unsubscribe();
    }
  }

  subscribeToHabits() {
    this.habitsSubscription = this.habitService.habits$.subscribe(habits => {
      this.habits = habits;

      // Inicializar set de completados hoy
      const today = new Date().toISOString().split('T')[0];
      this.completedHabitsToday = new Set(
        habits
          .filter(h => h.last_completion_date === today)
          .map(h => h.id)
      );

      this.applyFilter();
      this.isLoading = false;
    });
  }

  async loadHabits() {
    this.isLoading = true;
    await this.habitService.loadHabits();
  }

  onFilterChange() {
    this.applyFilter();
  }

  applyFilter() {
    switch (this.filterSegment) {
      case 'all':
        this.filteredHabits = this.habits.filter(h => h.is_active);
        break;
      case 'today':
        this.filteredHabits = this.getTodayHabits();
        this.calculateTodayStats();
        break;
      case 'paused':
        this.filteredHabits = this.habits.filter(h => h.is_paused);
        break;
      default:
        this.filteredHabits = this.habits;
    }
  }

  getTodayHabits(): Habit[] {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return this.habits.filter(habit => {
      if (!habit.is_active || habit.is_paused) return false;
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'specific_days' && habit.specific_days) {
        return habit.specific_days.includes(today);
      }
      return false;
    });
  }

  calculateTodayStats() {
    const todayHabits = this.filteredHabits;
    this.completedToday = Array.from(this.completedHabitsToday).filter(id =>
      todayHabits.some(h => h.id === id)
    ).length;

    this.completionPercentage = todayHabits.length > 0
      ? Math.round((this.completedToday / todayHabits.length) * 100)
      : 0;
  }

  async toggleComplete(habit: Habit, event: Event) {
    event.stopPropagation();

    if (habit.is_paused) return;

    const isCompleted = this.isHabitCompletedToday(habit);

    if (isCompleted) {
      this.completedHabitsToday.delete(habit.id);
    } else {
      try {
        const request = await this.habitService.completeHabit({
          habit_id: habit.id,
          status: 'completed'
        });

        request.subscribe({
          next: (response) => {
            if (response.success) {
              this.completedHabitsToday.add(habit.id);
              this.calculateTodayStats();
              this.showSuccessToast('¡Hábito completado! 🎉');
            }
          },
          error: (error) => {
            this.showErrorAlert(error.message || 'Error al completar hábito');
          }
        });
      } catch (error) {
        console.error('Error al completar hábito:', error);
      }
    }

    this.calculateTodayStats();
  }

  isHabitCompletedToday(habit: Habit): boolean {
    return this.completedHabitsToday.has(habit.id);
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

  async openFilterMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        { text: 'Actualizar', icon: 'refresh', handler: () => this.loadHabits() },
        { text: 'Ver estadísticas', icon: 'stats-chart', handler: () => { /* TODO */ } },
        { text: 'Cancelar', icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  goToCreate() {
    this.router.navigate(['/habits/create']);
  }

  goToDetail(habitId: number) {
    this.router.navigate(['/habits/detail', habitId]);
  }

  async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
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
