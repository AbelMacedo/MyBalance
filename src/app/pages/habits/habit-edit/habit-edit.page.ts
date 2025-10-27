import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Habit, HabitCategory } from 'src/app/core/models/habit.model';
import { HabitService } from 'src/app/core/services/habit.service';

@Component({
  selector: 'app-habit-edit',
  templateUrl: './habit-edit.page.html',
  styleUrls: ['./habit-edit.page.scss'],
  standalone: false
})
export class HabitEditPage implements OnInit {
  habitForm!: FormGroup;
  habitId!: number;
  habit?: Habit;
  isSubmitted = false;
  isLoading = true;
  isSaving = false;
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
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.habitId = parseInt(id);
      this.initForm();
      this.loadCategories();
      this.loadHabit();
    }
  }

  initForm() {
    this.habitForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      icon: ['checkmark-circle'],
      category_id: [null],
      frequency: ['daily', Validators.required],
      priority: ['medium'],
      target_count: [1, [Validators.min(1)]],
      is_active: [true]
    });
  }

  loadCategories() {
    this.habitService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  async loadHabit() {
    this.isLoading = true;

    try {
      const request = await this.habitService.getHabitById(this.habitId);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.habit = response.data.habit;
            this.populateForm();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar hábito:', error);
          this.isLoading = false;
          this.showErrorAlert('No se pudo cargar el hábito');
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }

  populateForm() {
    if (!this.habit) return;

    this.habitForm.patchValue({
      name: this.habit.name,
      description: this.habit.description || '',
      icon: this.habit.icon,
      category_id: this.habit.category_id,
      frequency: this.habit.frequency,
      priority: this.habit.priority,
      target_count: this.habit.target_count,
      is_active: this.habit.is_active
    });

    // Cargar días específicos si existen
    if (this.habit.frequency === 'specific_days' && this.habit.specific_days) {
      this.selectedDays = [...this.habit.specific_days];
    }
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

  async onSubmit() {
    this.isSubmitted = true;

    if (this.habitForm.invalid) {
      this.showErrorAlert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar días específicos
    if (this.habitForm.get('frequency')?.value === 'specific_days' && this.selectedDays.length === 0) {
      this.showErrorAlert('Debes seleccionar al menos un día');
      return;
    }

    this.isSaving = true;

    const habitData = {
      ...this.habitForm.value,
      specific_days: this.habitForm.get('frequency')?.value === 'specific_days'
        ? this.selectedDays
        : null
    };

    try {
      const request = await this.habitService.updateHabit(this.habitId, habitData);

      request.subscribe({
        next: async (response) => {
          this.isSaving = false;

          if (response.success) {
            await this.showSuccessAlert();
            this.router.navigate(['/habits/detail', this.habitId]);
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.showErrorAlert(error.message || 'Error al actualizar el hábito');
        }
      });

    } catch (error: any) {
      this.isSaving = false;
      this.showErrorAlert('Error de conexión. Intenta nuevamente.');
    }
  }

  cancel() {
    this.router.navigate(['/habits/detail', this.habitId]);
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Hábito Actualizado!',
      message: 'Los cambios han sido guardados exitosamente.',
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
