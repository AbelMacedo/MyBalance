import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isSubmitted = false;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    this.isSubmitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    try {
      const loginRequest = await this.authService.login({ email, password });

      loginRequest.subscribe({
        next: async (response) => {
          this.isLoading = false;

          if (response.success) {
            await this.showSuccessAlert();
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = 'Error de conexión. Intenta nuevamente.';
    }
  }


  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Bienvenido!',
      message: 'Has iniciado sesión correctamente',
      buttons: ['OK'],
      cssClass: 'success-alert'
    });

    await alert.present();
  }
}
