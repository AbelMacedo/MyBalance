import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { MoodEntry } from 'src/app/core/models/mood.model';
import { MoodService } from 'src/app/core/services/mood.service';

@Component({
  selector: 'app-mood-detail',
  templateUrl: './mood-detail.page.html',
  styleUrls: ['./mood-detail.page.scss'],
  standalone: false
})
export class MoodDetailPage implements OnInit {
  entry?: MoodEntry;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private moodService: MoodService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) { }

  ngOnInit() {
    const entryId = this.route.snapshot.paramMap.get('id');
    if (entryId) {
      this.loadEntry(parseInt(entryId));
    }
  }

  async loadEntry(entryId: number) {
    this.isLoading = true;

    try {
      const request = await this.moodService.getMoodEntryById(entryId);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.entry = response.data.entry;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar registro:', error);
          this.isLoading = false;
          this.showErrorAlert('No se pudo cargar el registro');
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCategoryName(category?: string): string {
    switch (category) {
      case 'positive': return 'Positiva';
      case 'neutral': return 'Neutral';
      case 'negative': return 'Negativa';
      default: return 'No definida';
    }
  }

  getIntensityLabel(intensity: number): string {
    switch (intensity) {
      case 1: return 'Muy bajo';
      case 2: return 'Bajo';
      case 3: return 'Moderado';
      case 4: return 'Alto';
      case 5: return 'Muy alto';
      default: return '';
    }
  }

  async openOptionsMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Eliminar',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.confirmDelete();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: 'Eliminar Registro',
      message: '¿Estás seguro de que deseas eliminar este registro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteEntry();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteEntry() {
    if (!this.entry) return;

    try {
      const request = await this.moodService.deleteMoodEntry(this.entry.id);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/mood/list']);
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

  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
