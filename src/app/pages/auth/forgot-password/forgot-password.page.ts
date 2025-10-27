import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false
})
export class ForgotPasswordPage implements OnInit {
  forgotPasswordForm!: FormGroup;
  isSubmitted = false;
  isLoading = false;
  emailSent = false;
  errorMessage = '';
  submittedEmail = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit() {
    this.isSubmitted = true;
    this.errorMessage = '';

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.submittedEmail = this.forgotPasswordForm.value.email;

    try {
      const request = await this.authService.requestPasswordReset(this.submittedEmail);

      request.subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response.success) {
            this.emailSent = true;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al enviar el correo. Intenta nuevamente.';
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = 'Error de conexión. Intenta nuevamente.';
    }
  }

  async resendEmail() {
    this.emailSent = false;
    this.isSubmitted = false;
    this.forgotPasswordForm.patchValue({ email: this.submittedEmail });
    const alert = await this.alertController.create({
      header: 'Reenviar correo',
      message: '¿Deseas reenviar las instrucciones de recuperación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Reenviar',
          handler: () => {
            this.onSubmit();
          }
        }
      ]
    });

    await alert.present();
  }
}
