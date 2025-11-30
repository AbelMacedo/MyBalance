import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { WellnessService } from 'src/app/core/services/wellness.service';
import { UserChallenge } from 'src/app/core/models/wellness.model';

@Component({
  selector: 'app-challenge-detail',
  templateUrl: './challenge-detail.page.html',
  styleUrls: ['./challenge-detail.page.scss'],
  standalone: false
})
export class ChallengeDetailPage implements OnInit {
  challenge?: UserChallenge;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wellnessService: WellnessService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const challengeId = this.route.snapshot.paramMap.get('id');
    if (challengeId) {
      this.loadChallenge(parseInt(challengeId));
    }
  }

  loadChallenge(id: number) {
    this.wellnessService.userChallenges$.subscribe(challenges => {
      this.challenge = challenges.find(c => c.id === id);
      this.isLoading = false;
    });
  }

  async markToday() {
    if (!this.challenge) return;

    try {
      const request = await this.wellnessService.updateChallengeProgress(
        this.challenge.id,
        { is_completed: true }
      );

      request.subscribe({
        next: async (response) => {
          if (response.success) {
            const alert = await this.alertController.create({
              header: '¡Progreso Guardado!',
              message: response.data?.is_challenge_completed
                ? '🎉 ¡Felicidades! Has completado el reto.'
                : '✅ Día marcado como completado',
              buttons: ['OK']
            });
            await alert.present();

            if (response.data?.is_challenge_completed) {
              this.router.navigate(['/wellness/challenges']);
            }
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

  async abandonChallenge() {
    if (!this.challenge) return;

    const alert = await this.alertController.create({
      header: 'Abandonar Reto',
      message: '¿Estás seguro de que deseas abandonar este reto? Perderás todo el progreso.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Abandonar',
          role: 'destructive',
          handler: async () => {
            try {
              const request = await this.wellnessService.abandonChallenge(this.challenge!.id);

              request.subscribe({
                next: () => {
                  this.router.navigate(['/wellness/challenges']);
                },
                error: (error) => {
                  console.error('Error:', error);
                }
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
