import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ActionSheetController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TaskService } from 'src/app/core/services/task.service';
import { Task } from 'src/app/core/models/task.model';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss'],
  standalone: false
})
export class TaskListPage implements OnInit, OnDestroy {
  tasks: Task[] = [];
  pendingTasks: Task[] = [];
  completedTasks: Task[] = [];
  selectedDate: string = 'today';
  isLoading = true;
  showCompleted = false;
  completedToday = 0;
  completionPercentage = 0;

  private tasksSubscription?: Subscription;

  constructor(
    private taskService: TaskService,
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadTasks();
    this.subscribeToTasks();
  }

  ngOnDestroy() {
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }

  subscribeToTasks() {
    this.tasksSubscription = this.taskService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
      this.separateTasks();
      this.calculateStats();
      this.isLoading = false;
    });
  }

  async loadTasks() {
    this.isLoading = true;
    const filters = this.getFiltersFromDate();
    await this.taskService.loadTasks(filters);
  }

  getFiltersFromDate() {
    const today = new Date();
    let targetDate: Date;

    switch (this.selectedDate) {
      case 'yesterday':
        targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - 1);
        break;
      case 'today':
        targetDate = today;
        break;
      case 'tomorrow':
        targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + 1);
        break;
      case 'all':
        return {};
      default:
        targetDate = today;
    }

    const dateString = targetDate.toISOString().split('T')[0];
    return { task_date: dateString };
  }

  onDateChange() {
    this.loadTasks();
  }

  separateTasks() {
    this.pendingTasks = this.tasks.filter(t => !t.is_completed);
    this.completedTasks = this.tasks.filter(t => t.is_completed);

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    this.pendingTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  calculateStats() {
    this.completedToday = this.completedTasks.length;
    this.completionPercentage = this.tasks.length > 0
      ? Math.round((this.completedToday / this.tasks.length) * 100)
      : 0;
  }

  async toggleComplete(task: Task, event: Event) {
    event.stopPropagation();

    try {
      const request = await this.taskService.toggleTaskComplete(task.id);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessToast(
              task.is_completed ? 'Tarea marcada como pendiente' : '¡Tarea completada! 🎉'
            );
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

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  }

  formatCompletedTime(completedAt?: string): string {
    if (!completedAt) return '';

    const date = new Date(completedAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  getEmptyMessage(): string {
    switch (this.selectedDate) {
      case 'yesterday': return 'para ayer';
      case 'today': return 'para hoy';
      case 'tomorrow': return 'para mañana';
      case 'all': return 'registradas';
      default: return '';
    }
  }

  toggleShowCompleted() {
    this.showCompleted = !this.showCompleted;
  }

  async openOptionsMenu(task: Task, event: Event) {
    event.stopPropagation();

    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Ver detalle',
          icon: 'eye',
          handler: () => this.goToDetail(task.id)
        },
        {
          text: 'Posponer',
          icon: 'calendar',
          handler: () => this.postponeTask(task)
        },
        {
          text: 'Eliminar',
          icon: 'trash',
          role: 'destructive',
          handler: () => this.confirmDelete(task)
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

  async postponeTask(task: Task) {
    const alert = await this.alertController.create({
      header: 'Posponer Tarea',
      message: 'Selecciona una nueva fecha',
      inputs: [
        {
          name: 'new_date',
          type: 'date',
          value: task.task_date
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.new_date) {
              try {
                const request = await this.taskService.postponeTask(task.id, data.new_date);
                request.subscribe({
                  next: (response) => {
                    if (response.success) this.showSuccessToast('Tarea pospuesta');
                  },
                  error: (error) => this.showErrorAlert(error.message)
                });
              } catch (error) {
                console.error('Error:', error);
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDelete(task: Task) {
    const alert = await this.alertController.create({
      header: 'Eliminar Tarea',
      message: '¿Estás seguro de que deseas eliminar esta tarea?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const request = await this.taskService.deleteTask(task.id);
              request.subscribe({
                next: (response) => {
                  if (response.success) this.showSuccessToast('Tarea eliminada');
                },
                error: (error) => this.showErrorAlert(error.message)
              });
            } catch (error) {
              console.error('Error:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openFilterMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Filtrar',
      buttons: [
        {
          text: 'Actualizar',
          icon: 'refresh',
          handler: () => this.loadTasks()
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

  goToCreate() {
    this.router.navigate(['/tasks/create']);
  }

  goToDetail(taskId: number) {
    this.router.navigate(['/tasks/detail', taskId]);
  }

  goToBalance() {
    this.router.navigate(['/balance/daily']);
  }

  // ✔️ TOAST CORRECTO
  async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'top'
    });

    await toast.present();
  }

  // ✔️ ALERT CORRECTO
  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
