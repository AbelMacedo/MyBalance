import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { BalanceService } from 'src/app/core/services/balance.service';

@Component({
  selector: 'app-daily-balance',
  templateUrl: './daily-balance.page.html',
  styleUrls: ['./daily-balance.page.scss'],
  standalone: false
})
export class DailyBalancePage implements OnInit {
  balanceForm!: FormGroup;
  selectedRating: number = 0;
  isSubmitted = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private balanceService: BalanceService,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.initForm();
    this.checkExistingBalance();
  }

  initForm() {
    this.balanceForm = this.formBuilder.group({
      what_went_well: ['', [Validators.required, Validators.minLength(10)]],
      what_to_improve: ['', [Validators.required, Validators.minLength(10)]],
      day_rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  async checkExistingBalance() {
    try {
      const request = await this.balanceService.getTodayBalance();

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.loadExistingBalance(response.data.balance);
          }
        },
        error: (error) => {
          // ✅ No hay balance de hoy, es normal
          // No mostramos error porque no es un problema
          console.log('No hay balance para hoy (es normal)'); // ← Mensaje informativo
        }
      });
    } catch (error) {
      // Error de conexión, tampoco es crítico
      console.log('No se pudo verificar balance existente');
    }
  }

  loadExistingBalance(balance: any) {
    this.balanceForm.patchValue({
      what_went_well: balance.what_went_well,
      what_to_improve: balance.what_to_improve
    });
    this.selectedRating = balance.day_rating;

    this.showInfoAlert();
  }

  selectRating(rating: number) {
    this.selectedRating = rating;
    this.balanceForm.patchValue({ day_rating: rating });
  }

  getRatingLabel(rating: number): string {
    switch (rating) {
      case 1: return '😞 Día muy difícil';
      case 2: return '😕 Día complicado';
      case 3: return '😐 Día regular';
      case 4: return '😊 Buen día';
      case 5: return '🤩 ¡Excelente día!';
      default: return 'Selecciona tu calificación';
    }
  }

  async onSubmit() {
    this.isSubmitted = true;

    if (this.balanceForm.invalid || this.selectedRating === 0) {
      this.showErrorAlert('Por favor completa todos los campos');
      return;
    }

    this.isLoading = true;

    const today = new Date().toISOString().split('T')[0];

    const balanceData = {
      balance_date: today,
      what_went_well: this.balanceForm.get('what_went_well')?.value,
      what_to_improve: this.balanceForm.get('what_to_improve')?.value,
      day_rating: this.selectedRating
    };

    try {
      const request = await this.balanceService.saveDailyBalance(balanceData);

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
          this.showErrorAlert(error.message || 'Error al guardar el balance');
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
      header: '¡Balance Guardado! ⭐',
      message: 'Has completado tu reflexión del día. ¡Sigue así!',
      buttons: ['OK']
    });

    await alert.present();
  }

  async showInfoAlert() {
    const alert = await this.alertController.create({
      header: 'Balance Existente',
      message: 'Ya tienes un balance guardado para hoy. Puedes modificarlo si lo deseas.',
      buttons: ['Entendido']
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
