import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: false
})
export class ResetPasswordPage implements OnInit {
  resetPasswordForm!: FormGroup;
  isSubmitted = false;
  isLoading = false;
  errorMessage = '';
  token: string = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    // Obtener token de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.showErrorAndRedirect();
      }
    });

    this.initForm();
  }

  initForm() {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Observar cambios en la contraseña para calcular fortaleza
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmation = form.get('password_confirmation');
    
    if (password?.value !== confirmation?.value) {
      return { passwordsMismatch: true };
    }
    return null;
  }

  calculatePasswordStrength(password: string) {
    if (!password) {
      this.passwordStrength = 'weak';
      return;
    }

    let strength = 0;

    // Longitud
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Tiene números
    if (/\d/.test(password)) strength++;

    // Tiene minúsculas y mayúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;

    // Tiene caracteres especiales
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  getPasswordStrengthLabel(): string {
    switch (this.passwordStrength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Media';
      case 'strong': return 'Fuerte';
    }
  }

  getPasswordStrengthValue(): number {
    switch (this.passwordStrength) {
      case 'weak': return 0.33;
      case 'medium': return 0.66;
      case 'strong': return 1;
    }
  }

  getPasswordStrengthColor(): string {
    switch (this.passwordStrength) {
      case 'weak': return 'danger';
      case 'medium': return 'warning';
      case 'strong': return 'success';
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit() {
    this.isSubmitted = true;
    this.errorMessage = '';

    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;

    try {
      const { password, password_confirmation } = this.resetPasswordForm.value;
      
      const request = await this.authService.resetPassword(
        this.token, 
        password, 
        password_confirmation
      );

      request.subscribe({
        next: async (response) => {
          this.isLoading = false;

          if (response.success) {
            const alert = await this.alertController.create({
              header: '¡Éxito!',
              message: 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.',
              buttons: [{
                text: 'Iniciar Sesión',
                handler: () => {
                  this.router.navigate(['/login']);
                }
              }]
            });
            await alert.present();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.';
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = 'Error de conexión. Intenta nuevamente.';
    }
  }

  async showErrorAndRedirect() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.',
      buttons: [{
        text: 'Solicitar Nuevo Enlace',
        handler: () => {
          this.router.navigate(['/forgot-password']);
        }
      }]
    });
    await alert.present();
  }
}