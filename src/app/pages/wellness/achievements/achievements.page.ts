import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WellnessService } from 'src/app/core/services/wellness.service';
import { Achievement, UserPoints } from 'src/app/core/models/wellness.model';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.page.html',
  styleUrls: ['./achievements.page.scss'],
  standalone: false
})
export class AchievementsPage implements OnInit, OnDestroy {
  achievements: Achievement[] = [];
  userPoints?: UserPoints;
  unlockedCount = 0;
  isLoading = true;

  private achievementsSubscription?: Subscription;
  private pointsSubscription?: Subscription;

  constructor(private wellnessService: WellnessService) {}

  ngOnInit() {
    this.loadData();
    this.subscribeToData();
  }

  ngOnDestroy() {
    if (this.achievementsSubscription) this.achievementsSubscription.unsubscribe();
    if (this.pointsSubscription) this.pointsSubscription.unsubscribe();
  }

  subscribeToData() {
    this.achievementsSubscription = this.wellnessService.achievements$.subscribe(achievements => {
      this.achievements = achievements;
      this.unlockedCount = achievements.filter(a => a.is_unlocked).length;
      this.isLoading = false;
    });

    this.pointsSubscription = this.wellnessService.userPoints$.subscribe(points => {
      this.userPoints = points || undefined;
    });
  }

  async loadData() {
    await this.wellnessService.loadAchievements();
    await this.wellnessService.loadUserPoints();
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return 'medium';
      case 'rare': return 'primary';
      case 'epic': return 'secondary';
      case 'legendary': return 'warning';
      default: return 'medium';
    }
  }

  getRarityLabel(rarity: string): string {
    switch (rarity) {
      case 'common': return 'Común';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Legendario';
      default: return rarity;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
