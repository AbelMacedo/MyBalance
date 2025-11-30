import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { TaskService } from 'src/app/core/services/task.service';
import { Task } from 'src/app/core/models/task.model';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: false
})
export class TaskDetailPage implements OnInit {
  task?: Task;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      this.loadTask(parseInt(taskId));
    }
  }

  async loadTask(taskId: number) {
    this.isLoading = true;

    try {
      const request = await this.taskService.getTaskById(taskId);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.task = response.data.task;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }

  getPriorityColor(priority: string): string {
    const colors: any = { high: 'danger', medium: 'warning', low: 'success' };
    return colors[priority] || 'medium';
  }

  getPriorityLabel(priority: string): string {
    const labels: any = { high: 'Alta', medium: 'Media', low: 'Baja' };
    return labels[priority] || priority;
  }

  getRecurrenceLabel(pattern?: string): string {
    const labels: any = { daily: 'Diaria', weekly: 'Semanal', monthly: 'Mensual' };
    return labels[pattern || ''] || 'No definido';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  }

  async toggleComplete() {
    if (!this.task) return;

    try {
      const request = await this.taskService.toggleTaskComplete(this.task.id);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTask(this.task!.id);
          }
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async openOptionsMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
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

  async confirmDelete() {
    if (!this.task) return;

    const alert = await this.alertController.create({
      header: 'Eliminar Tarea',
      message: '¿Estás seguro?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const request = await this.taskService.deleteTask(this.task!.id);
              request.subscribe({
                next: () => this.router.navigate(['/tasks/list']),
                error: (error) => console.error('Error:', error)
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
}
