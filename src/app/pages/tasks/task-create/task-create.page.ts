import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TaskService } from 'src/app/core/services/task.service';
import { TaskCategory } from 'src/app/core/models/task.model';

@Component({
  selector: 'app-task-create',
  templateUrl: './task-create.page.html',
  styleUrls: ['./task-create.page.scss'],
  standalone: false
})
export class TaskCreatePage implements OnInit {
  taskForm!: FormGroup;
  categories: TaskCategory[] = [];
  isSubmitted = false;
  isLoading = false;

  selectedTaskDate: string = '';
  selectedReminderTime: string = '';

  minDate: string = '';
  maxDate: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadCategories();
    this.setDateLimits();

    // Establecer fecha de hoy por defecto
    const today = new Date().toISOString();
    this.selectedTaskDate = today;
    this.taskForm.patchValue({ task_date: today.split('T')[0] });
  }

  initForm() {
    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      category_id: [null],
      priority: ['medium'],
      estimated_time: [null],
      task_date: ['', Validators.required],
      is_recurring: [false],
      recurrence_pattern: [null],
      reminder_enabled: [false],
      reminder_time: [null]
    });
  }

  loadCategories() {
    this.taskService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  setDateLimits() {
    const today = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);

    this.minDate = today.toISOString();
    this.maxDate = maxFutureDate.toISOString();
  }

  onDateSelected(event: any) {
    const date = new Date(event.detail.value);
    this.taskForm.patchValue({ task_date: date.toISOString().split('T')[0] });
  }

  onTimeSelected(event: any) {
    const time = new Date(event.detail.value);
    const timeString = time.toTimeString().split(' ')[0];
    this.taskForm.patchValue({ reminder_time: timeString });
  }

  onRecurringChange() {
    const isRecurring = this.taskForm.get('is_recurring')?.value;
    if (!isRecurring) {
      this.taskForm.patchValue({ recurrence_pattern: null });
    }
  }

  onReminderChange() {
    const reminderEnabled = this.taskForm.get('reminder_enabled')?.value;
    if (!reminderEnabled) {
      this.taskForm.patchValue({ reminder_time: null });
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
      default: return 'Media';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  async onSubmit() {
    this.isSubmitted = true;

    if (this.taskForm.invalid) {
      this.showErrorAlert('Por favor completa todos los campos obligatorios');
      return;
    }

    this.isLoading = true;

    const taskData = {
      ...this.taskForm.value
    };

    try {
      const request = await this.taskService.createTask(taskData);

      request.subscribe({
        next: async (response) => {
          this.isLoading = false;

          if (response.success) {
            await this.showSuccessAlert();
            this.router.navigate(['/tasks/list']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorAlert(error.message || 'Error al crear la tarea');
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      this.showErrorAlert('Error de conexión. Intenta nuevamente.');
    }
  }

  cancel() {
    this.router.navigate(['/tasks/list']);
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Tarea Creada!',
      message: 'Tu tarea ha sido creada exitosamente.',
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
