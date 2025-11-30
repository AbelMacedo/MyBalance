import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Emotion, EmotionTag } from 'src/app/core/models/mood.model';
import { MoodService } from 'src/app/core/services/mood.service';

@Component({
  selector: 'app-mood-create',
  templateUrl: './mood-create.page.html',
  styleUrls: ['./mood-create.page.scss'],
  standalone: false
})
export class MoodCreatePage implements OnInit {
  emotions: Emotion[] = [];
  tags: EmotionTag[] = [];

  selectedEmotion?: Emotion;
  intensity: number = 3;
  note: string = '';
  selectedTagIds: number[] = [];

  isSubmitted = false;
  isLoading = false;

  constructor(
    private moodService: MoodService,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadEmotions();
    this.loadTags();
  }

  loadEmotions() {
    this.moodService.emotions$.subscribe(emotions => {
      // Ordenar por categoría
      this.emotions = emotions.sort((a, b) => {
        const order = { positive: 1, neutral: 2, negative: 3 };
        return order[a.category] - order[b.category];
      });
    });
  }

  loadTags() {
    this.moodService.tags$.subscribe(tags => {
      this.tags = tags;
    });
  }

  selectEmotion(emotion: Emotion) {
    this.selectedEmotion = emotion;
  }

  toggleTag(tagId: number) {
    const index = this.selectedTagIds.indexOf(tagId);
    if (index > -1) {
      this.selectedTagIds.splice(index, 1);
    } else {
      this.selectedTagIds.push(tagId);
    }
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  async onSubmit() {
    this.isSubmitted = true;

    if (!this.selectedEmotion) {
      this.showErrorAlert('Debes seleccionar una emoción');
      return;
    }

    if (this.note.length > 500) {
      this.showErrorAlert('La nota no puede superar los 500 caracteres');
      return;
    }

    this.isLoading = true;

    const entryData = {
      emotion_id: this.selectedEmotion.id,
      intensity: this.intensity,
      note: this.note || undefined,
      tag_ids: this.selectedTagIds.length > 0 ? this.selectedTagIds : undefined
    };

    try {
      const request = await this.moodService.createMoodEntry(entryData);

      request.subscribe({
        next: async (response) => {
          this.isLoading = false;

          if (response.success) {
            await this.showSuccessAlert();
            this.router.navigate(['/mood/list']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorAlert(error.message || 'Error al guardar el registro');
        }
      });

    } catch (error: any) {
      this.isLoading = false;
      this.showErrorAlert('Error de conexión. Intenta nuevamente.');
    }
  }

  cancel() {
    this.router.navigate(['/mood/list']);
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Registro Guardado! 😊',
      message: 'Tu estado emocional ha sido registrado exitosamente.',
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
