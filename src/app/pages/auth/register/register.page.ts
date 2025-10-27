import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  isSubmitted = false;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.registerForm = this.formBuilder.group({
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('password_confirmation');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onRegister() {
    this.isSubmitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;

    const { full_name, email, password, password_confirmation } = this.registerForm.value;

    try {
      const registerRequest = await this.authService.register({
        full_name,
        email,
        password,
        password_confirmation
      });

      registerRequest.subscribe({
        next: async (response) => {
          this.isLoading = false;

          if (response.success) {
            await this.showSuccessAlert();
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al crear la cuenta. Intenta nuevamente.';
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = 'Error de conexión. Intenta nuevamente.';
    }
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Cuenta Creada!',
      message: 'Tu cuenta ha sido creada exitosamente. ¡Bienvenido a Mi Balance!',
      buttons: ['OK'],
      cssClass: 'success-alert'
    });

    await alert.present();
  }

  openTerms(event: Event) {
    event.preventDefault();
    this.showTermsAlert();
  }

  async showTermsAlert() {
    const alert = await this.alertController.create({
      header: 'Términos y Condiciones',
      message: 'Aquí irían los términos y condiciones de uso de la aplicación Mi Balance...',
      buttons: ['Cerrar']
    });

    await alert.present();
  }
}
