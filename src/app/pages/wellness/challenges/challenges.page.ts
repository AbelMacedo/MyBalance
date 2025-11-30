import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { WellnessService } from 'src/app/core/services/wellness.service';
import { Challenge, UserChallenge, UserPoints } from 'src/app/core/models/wellness.model';

@Component({
  selector: 'app-challenges',
  templateUrl: './challenges.page.html',
  styleUrls: ['./challenges.page.scss'],
  standalone: false
})
export class ChallengesPage implements OnInit, OnDestroy {
  availableChallenges: Challenge[] = [];
  activeChallenges: UserChallenge[] = [];
  completedChallenges: UserChallenge[] = [];
  userPoints?: UserPoints;

  selectedTab: string = 'available';
  isLoading = false;

  private challengesSubscription?: Subscription;
  private userChallengesSubscription?: Subscription;
  private pointsSubscription?: Subscription;

  constructor(
    private wellnessService: WellnessService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
    this.subscribeToData();
  }

  ngOnDestroy() {
    if (this.challengesSubscription) this.challengesSubscription.unsubscribe();
    if (this.userChallengesSubscription) this.userChallengesSubscription.unsubscribe();
    if (this.pointsSubscription) this.pointsSubscription.unsubscribe();
  }

  subscribeToData() {
    this.challengesSubscription = this.wellnessService.challenges$.subscribe(challenges => {
      this.availableChallenges = challenges;
    });

    this.userChallengesSubscription = this.wellnessService.userChallenges$.subscribe(challenges => {
      this.activeChallenges = challenges.filter(c => !c.is_completed);
      this.completedChallenges = challenges.filter(c => c.is_completed);
    });

    this.pointsSubscription = this.wellnessService.userPoints$.subscribe(points => {
      this.userPoints = points || undefined;
    });
  }

  async loadData() {
    this.isLoading = true;
    await this.wellnessService.loadChallenges();
    await this.wellnessService.loadUserChallenges();
    await this.wellnessService.loadUserPoints();
    this.isLoading = false;
  }

  onTabChange() {
    if (this.selectedTab === 'active') {
      this.wellnessService.loadUserChallenges(false);
    } else if (this.selectedTab === 'completed') {
      this.wellnessService.loadUserChallenges(true);
    }
  }

  async joinChallenge(challenge: Challenge) {
    const alert = await this.alertController.create({
      header: '¿Unirse al Reto?',
      message: `¿Estás listo para el reto "${challenge.title}"? Tendrás ${challenge.duration_days} días para completarlo y ganar ${challenge.points} puntos.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Unirse',
          handler: async () => {
            try {
              const request = await this.wellnessService.joinChallenge(challenge.id);

              request.subscribe({
                next: async (response) => {
                  if (response.success) {
                    await this.showSuccessAlert('¡Te has unido al reto!', '¡Mucha suerte! 💪');
                    this.selectedTab = 'active';
                    this.onTabChange();
                  }
                },
                error: (error) => {
                  this.showErrorAlert(error.message || 'No se pudo unir al reto');
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

  async markTodayProgress(challenge: UserChallenge) {
    try {
      const request = await this.wellnessService.updateChallengeProgress(
        challenge.id,
        {
          is_completed: true
        }
      );

      request.subscribe({
        next: async (response) => {
          if (response.success) {
            if (response.data?.is_challenge_completed) {
              await this.showSuccessAlert(
                '¡Reto Completado! 🎉',
                `Has ganado ${challenge.points} puntos. ¡Felicidades!`
              );
            } else {
              await this.showSuccessToast('¡Progreso registrado! ✅');
            }
          }
        },
        error: (error) => {
          this.showErrorAlert(error.message);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'medium';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Medio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'daily': return 'Diario';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensual';
      default: return type;
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  }

  goToDetail(challengeId: number) {
    this.router.navigate(['/wellness/challenge-detail', challengeId]);
  }

  goToAchievements() {
    this.router.navigate(['/wellness/achievements']);
  }

  async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
