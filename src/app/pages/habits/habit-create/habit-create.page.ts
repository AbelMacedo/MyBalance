import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { HabitCategory } from 'src/app/core/models/habit.model';
import { HabitService } from 'src/app/core/services/habit.service';

@Component({
  selector: 'app-habit-create',
  templateUrl: './habit-create.page.html',
  styleUrls: ['./habit-create.page.scss'],
  standalone: false
})
export class HabitCreatePage implements OnInit {
  habitForm!: FormGroup;
  isSubmitted = false;
  isLoading = false;
  categories: HabitCategory[] = [];
  selectedDays: string[] = [];

  weekDays = [
    { label: 'Lun', value: 'monday' },
    { label: 'Mar', value: 'tuesday' },
    { label: 'Mié', value: 'wednesday' },
    { label: 'Jue', value: 'thursday' },
    { label: 'Vie', value: 'friday' },
    { label: 'Sáb', value: 'saturday' },
    { label: 'Dom', value: 'sunday' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private habitService: HabitService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadCategories();
  }

  initForm() {
    this.habitForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      icon: ['checkmark-circle'],
      category_id: [null],
      frequency: ['daily', Validators.required],
      priority: ['medium'],
      target_count: [1, [Validators.min(1)]]
    });
  }

  loadCategories() {
    this.habitService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  onFrequencyChange() {
    const frequency = this.habitForm.get('frequency')?.value;
    if (frequency !== 'specific_days') {
      this.selectedDays = [];
    }
  }

  toggleDay(day: string) {
    const index = this.selectedDays.indexOf(day);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(day);
    }
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }

  getPreviewColor(): string {
    const categoryId = this.habitForm.get('category_id')?.value;
    if (categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category?.color || '#667eea';
    }
    return '#667eea';
  }

  getPreviewFrequency(): string {
    const frequency = this.habitForm.get('frequency')?.value;

    switch (frequency) {
      case 'daily':
        return 'Todos los días';
      case 'specific_days':
        if (this.selectedDays.length === 0) {
          return 'Selecciona los días';
        }
        return `${this.selectedDays.length} días por semana`;
      case 'weekly':
        return 'Una vez por semana';
      default:
        return 'Frecuencia no definida';
    }
  }

  async onSubmit() {
    this.isSubmitted = true;

    if (this.habitForm.invalid) {
      this.showErrorAlert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (this.habitForm.get('frequency')?.value === 'specific_days' && this.selectedDays.length === 0) {
      this.showErrorAlert('Debes seleccionar al menos un día');
      return;
    }

    this.isLoading = true;

    const habitData = {
      ...this.habitForm.value,
      specific_days: this.habitForm.get('frequency')?.value === 'specific_days'
        ? this.selectedDays
        : null
    };

    try {
      const request = await this.habitService.createHabit(habitData);

      request.subscribe({
        next: async (response) => {
          this.isLoading = false;

          if (response.success) {
            await this.showSuccessAlert();
            this.router.navigate(['/habits/list']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorAlert(error.message || 'Error al crear el hábito');
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      this.showErrorAlert('Error de conexión. Intenta nuevamente.');
    }
  }

  cancel() {
    this.router.navigate(['/habits/list']);
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Hábito Creado!',
      message: 'Tu hábito ha sido creado exitosamente. ¡Comienza tu racha hoy!',
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
