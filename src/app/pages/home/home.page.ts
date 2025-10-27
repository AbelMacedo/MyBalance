import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Habit } from 'src/app/core/models/habit.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { HabitService } from 'src/app/core/services/habit.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  userName = '';
  userEmail = '';

  // Estadísticas
  totalHabits = 0;
  completedHabits = 0;
  longestStreak = 0;
  todayHabits: Habit[] = [];

  private habitsSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private habitService: HabitService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadUserInfo();
    this.loadHabitsData();
    this.subscribeToHabits();
  }

  ngOnDestroy() {
    if (this.habitsSubscription) {
      this.habitsSubscription.unsubscribe();
    }
  }

  loadUserInfo() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.full_name.split(' ')[0]; // Solo el primer nombre
      this.userEmail = user.email;
    }
  }

  async loadHabitsData() {
    await this.habitService.loadHabits(true); // Solo hábitos activos
  }

  subscribeToHabits() {
    this.habitsSubscription = this.habitService.habits$.subscribe(habits => {
      this.calculateStats(habits);
    });
  }

  calculateStats(habits: Habit[]) {
    const activeHabits = habits.filter(h => h.is_active && !h.is_paused);
    this.totalHabits = activeHabits.length;
    this.todayHabits = this.getTodayHabits(activeHabits);
    this.completedHabits = 0;
    this.longestStreak = activeHabits.length > 0
      ? Math.max(...activeHabits.map(h => h.longest_streak || 0))
      : 0;
  }

  getTodayHabits(habits: Habit[]): Habit[] {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return habits.filter(habit => {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'specific_days' && habit.specific_days) {
        return habit.specific_days.includes(today);
      }
      return false;
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días! Comienza tu día con energía 💪';
    else if (hour < 18) return '¡Buenas tardes! Sigue con tus hábitos 🌟';
    else return '¡Buenas noches! Revisa tu progreso del día 🌙';
  }

  async toggleHabitComplete(habit: Habit, event: any) {
    event.stopPropagation();
    const isChecked = event.detail.checked;

    if (isChecked) {
      try {
        const request = await this.habitService.completeHabit({
          habit_id: habit.id,
          status: 'completed'
        });

        request.subscribe({
          next: (response) => {
            if (response.success) {
              this.completedHabits++;
              this.showSuccessToast('¡Hábito completado! 🎉');
            }
          },
          error: (error) => console.error('Error al completar hábito:', error)
        });
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }

  // Navegación
  goToHabits() { this.router.navigate(['/habits/list']); }
  goToCreateHabit() { this.router.navigate(['/habits/create']); }
  goToHabitDetail(habitId: number) { this.router.navigate(['/habits/detail', habitId]); }
  goToMood() { this.showComingSoonAlert('Diario Emocional'); }
  goToTasks() { this.showComingSoonAlert('Planificación de Tareas'); }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar Sesión', role: 'destructive', handler: () => this.authService.logout() }
      ]
    });
    await alert.present();
  }

  // ------------------------------
  // Mensajes temporales y alertas
  // ------------------------------
  async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  async showComingSoonAlert(feature: string) {
    const alert = await this.alertController.create({
      header: 'Próximamente',
      message: `La funcionalidad de ${feature} estará disponible pronto.`,
      buttons: ['OK']
    });
    await alert.present();
  }
}
