import { Component, OnInit } from '@angular/core';
import { MoodTrends } from 'src/app/core/models/mood.model';
import { MoodService } from 'src/app/core/services/mood.service';

interface DailyAverage {
  date: string;
  avg: number;
}

interface Insight {
  icon: string;
  color: string;
  message: string;
}

@Component({
  selector: 'app-mood-stats',
  templateUrl: './mood-stats.page.html',
  styleUrls: ['./mood-stats.page.scss'],
  standalone: false
})

export class MoodStatsPage implements OnInit {
  trends?: MoodTrends;
  selectedPeriod: 'week' | 'month' | 'year' = 'month';
  isLoading = true;

  constructor(private moodService: MoodService) { }

  ngOnInit() {
    this.loadTrends();
  }

  async loadTrends() {
    this.isLoading = true;

    try {
      const request = await this.moodService.getMoodTrends(this.selectedPeriod);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // 🔧 Normalizamos los datos antes de asignar a trends
            const data = response.data;

            data.average_intensity = Number(data.average_intensity) || 0;


            data.category_stats = data.category_stats.map((cat: any) => ({
              ...cat,
              count: Number(cat.count) || 0,
              avg_intensity: parseFloat(cat.avg_intensity) || 0,
            }));

            data.daily_trend = data.daily_trend.map((day: any) => ({
              ...day,
              avg_intensity: parseFloat(day.avg_intensity) || 0,
              count: Number(day.count) || 0,
            }));

            data.top_emotions = data.top_emotions.map((emo: any) => ({
              ...emo,
              count: Number(emo.count) || 0,
            }));

            this.trends = data;
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar tendencias:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
    }
  }


  onPeriodChange() {
    this.loadTrends();
  }

  getTotalDays(): number {
    if (!this.trends) return 0;

    const uniqueDates = new Set(
      this.trends.daily_trend.map(d => d.entry_date)
    );

    return uniqueDates.size;
  }

  getPercentage(count: number): number {
    if (!this.trends) return 0;

    const total = this.trends.category_stats.reduce((sum, cat) => sum + cat.count, 0);
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  getCategoryName(category: string): string {
    switch (category) {
      case 'positive': return 'Positivas';
      case 'neutral': return 'Neutrales';
      case 'negative': return 'Negativas';
      default: return category;
    }
  }

  getCategoryEmoji(category: string): string {
    switch (category) {
      case 'positive': return '😊';
      case 'neutral': return '😐';
      case 'negative': return '😢';
      default: return '😐';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'positive': return 'success';
      case 'neutral': return 'warning';
      case 'negative': return 'danger';
      default: return 'medium';
    }
  }

  getCategoryColorBadge(category: string): string {
    switch (category) {
      case 'positive': return 'success';
      case 'neutral': return 'warning';
      case 'negative': return 'danger';
      default: return 'medium';
    }
  }

  getDailyAverages(): DailyAverage[] {
    if (!this.trends) return [];

    // Agrupar por fecha y calcular promedio
    const dailyMap: { [key: string]: { sum: number; count: number } } = {};

    this.trends.daily_trend.forEach(item => {
      if (!dailyMap[item.entry_date]) {
        dailyMap[item.entry_date] = { sum: 0, count: 0 };
      }
      dailyMap[item.entry_date].sum += parseFloat(item.avg_intensity.toString()) * item.count;
      dailyMap[item.entry_date].count += item.count;
    });

    const result = Object.keys(dailyMap)
      .sort()
      .map(date => ({
        date,
        avg: dailyMap[date].sum / dailyMap[date].count
      }));

    // Limitar a los últimos 30 días para mejor visualización
    return result.slice(-30);
  }

  getInsights(): Insight[] {
    if (!this.trends) return [];

    const insights: Insight[] = [];

    // Análisis de categoría predominante
    const totalCount = this.trends.category_stats.reduce((sum, cat) => sum + cat.count, 0);
    const positiveStats = this.trends.category_stats.find(c => c.category === 'positive');
    const negativeStats = this.trends.category_stats.find(c => c.category === 'negative');

    if (positiveStats && totalCount > 0) {
      const positivePercentage = (positiveStats.count / totalCount) * 100;

      if (positivePercentage >= 60) {
        insights.push({
          icon: 'happy',
          color: 'success',
          message: `¡Excelente! El ${positivePercentage.toFixed(0)}% de tus registros son emociones positivas. Sigue así.`
        });
      } else if (positivePercentage >= 40) {
        insights.push({
          icon: 'thumbs-up',
          color: 'primary',
          message: `Buen equilibrio emocional. El ${positivePercentage.toFixed(0)}% de tus registros son positivos.`
        });
      }
    }

    if (negativeStats && totalCount > 0) {
      const negativePercentage = (negativeStats.count / totalCount) * 100;

      if (negativePercentage >= 50) {
        insights.push({
          icon: 'medkit',
          color: 'warning',
          message: `Has registrado muchas emociones negativas (${negativePercentage.toFixed(0)}%). Considera hablar con alguien de confianza.`
        });
      }
    }

    // Análisis de intensidad promedio
    if (this.trends.average_intensity >= 4) {
      insights.push({
        icon: 'trending-up',
        color: 'success',
        message: `Tu intensidad emocional promedio es alta (${this.trends.average_intensity.toFixed(1)}/5). Estás experimentando emociones fuertes.`
      });
    } else if (this.trends.average_intensity <= 2.5) {
      insights.push({
        icon: 'trending-down',
        color: 'warning',
        message: `Tu intensidad emocional promedio es baja (${this.trends.average_intensity.toFixed(1)}/5). Intenta actividades que te energicen.`
      });
    }

    // Análisis de emoción más frecuente
    if (this.trends.top_emotions.length > 0) {
      const topEmotion = this.trends.top_emotions[0];
      insights.push({
        icon: 'star',
        color: 'secondary',
        message: `Tu emoción más registrada es "${topEmotion.name}" con ${topEmotion.count} registros.`
      });
    }

    // Análisis de constancia
    const totalDays = this.getTotalDays();
    const periodDays = this.selectedPeriod === 'week' ? 7 : this.selectedPeriod === 'month' ? 30 : 365;

    if (totalDays >= periodDays * 0.8) {
      insights.push({
        icon: 'trophy',
        color: 'warning',
        message: `¡Felicidades! Has registrado tu estado de ánimo ${totalDays} días. La constancia es clave para el autoconocimiento.`
      });
    }

    return insights;
  }
}
