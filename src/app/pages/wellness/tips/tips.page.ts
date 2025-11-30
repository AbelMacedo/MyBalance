import { Component, OnInit } from '@angular/core';
import { WellnessService } from 'src/app/core/services/wellness.service';
import { WellnessCategory, WellnessTip } from 'src/app/core/models/wellness.model';

@Component({
  selector: 'app-tips',
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
  standalone: false
})
export class TipsPage implements OnInit {
  categories: WellnessCategory[] = [];
  tips: WellnessTip[] = [];
  dailyTip?: WellnessTip;

  selectedCategory: string = 'all';
  expandedTipId: number | null = null;

  isLoading = false;
  isLoadingDaily = false;

  constructor(private wellnessService: WellnessService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadDailyTip();
    this.loadTips();
  }

  loadCategories() {
    this.wellnessService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  async loadDailyTip() {
    this.isLoadingDaily = true;

    try {
      const request = await this.wellnessService.getDailyTip();

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.dailyTip = response.data.tip;
          }
          this.isLoadingDaily = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.isLoadingDaily = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoadingDaily = false;
    }
  }

  async loadTips() {
    this.isLoading = true;

    const categoryId = this.selectedCategory === 'all' ? undefined : parseInt(this.selectedCategory);

    try {
      const request = await this.wellnessService.getTips(categoryId, undefined, 20);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tips = response.data.tips;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }

  onCategoryChange() {
    this.expandedTipId = null;
    this.loadTips();
  }

  expandTip(tip: WellnessTip) {
    this.expandedTipId = this.expandedTipId === tip.id ? null : tip.id;
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
}
