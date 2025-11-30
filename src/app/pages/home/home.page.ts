import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { HabitService } from 'src/app/core/services/habit.service';
import { TaskService } from 'src/app/core/services/task.service';
import { MoodService } from 'src/app/core/services/mood.service';
import { BalanceService } from 'src/app/core/services/balance.service';
import { WellnessService } from 'src/app/core/services/wellness.service';
import { Habit } from 'src/app/core/models/habit.model';
import { Task } from 'src/app/core/models/task.model';
import { WellnessTip, UserChallenge, UserPoints } from 'src/app/core/models/wellness.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  userName: string = 'Usuario';

  todayHabitsCompleted = 0;
  todayHabitsTotal = 0;
  todayTasksCompleted = 0;
  todayTasksTotal = 0;
  todayMoodRegistered = false;
  todayBalanceRegistered = false;

  maxHabitStreak = 0;
  weeklyTasksCompleted = 0;
  weeklyMoodCount = 0;
  weeklyMoodAverage = 0;

  dailyTip?: WellnessTip;
  activeChallenges: UserChallenge[] = [];
  userPoints?: UserPoints;

  isLoading = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private habitService: HabitService,
    private taskService: TaskService,
    private moodService: MoodService,
    private balanceService: BalanceService,
    private wellnessService: WellnessService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserName();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadUserName() {
    const user = await this.authService.getCurrentUser();
    if (user && user.full_name) {
      this.userName = user.full_name.split(' ')[0];
    }
  }

  async loadDashboardData() {
    this.isLoading = true;

    try {
      await Promise.all([
        this.loadHabitsData(),
        this.loadTasksData(),
        this.loadMoodData(),
        this.loadBalanceData(),
        this.loadWellnessData()
      ]);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadHabitsData() {
    await this.habitService.loadHabits();

    const habitsSub = this.habitService.habits$.subscribe(habits => {
      this.calculateHabitsStats(habits);
    });

    this.subscriptions.push(habitsSub);
  }

  calculateHabitsStats(habits: Habit[]) {
    const today = new Date().toISOString().split('T')[0];

    const todayHabits = habits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'specific_days') {
        const dayOfWeek = new Date().getDay().toString();
        return h.specific_days && h.specific_days.includes(dayOfWeek);
      }
      return false;
    });

    this.todayHabitsTotal = todayHabits.length;
    this.todayHabitsCompleted = todayHabits.filter(h => h.last_completion_date === today).length;
    this.maxHabitStreak = Math.max(...habits.map(h => h.current_streak || 0), 0);
  }

  async loadTasksData() {
    const today = new Date().toISOString().split('T')[0];
    await this.taskService.loadTasks({ task_date: today });

    const tasksSub = this.taskService.tasks$.subscribe(tasks => {
      this.calculateTasksStats(tasks);
    });

    this.subscriptions.push(tasksSub);
    await this.loadWeeklyTasksStats();
  }

  calculateTasksStats(tasks: Task[]) {
    this.todayTasksTotal = tasks.length;
    this.todayTasksCompleted = tasks.filter(t => t.is_completed).length;
  }

  async loadWeeklyTasksStats() {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const startDate = weekAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const request = await this.taskService.getTaskStats(startDate, endDate);

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.weeklyTasksCompleted = response.data.completed;
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

  async loadMoodData() {
    const today = new Date().toISOString().split('T')[0];
    await this.moodService.loadMoodEntries({
      start_date: today,
      end_date: today
    });

    const moodSub = this.moodService.moodEntries$.subscribe(entries => {
      this.todayMoodRegistered = entries.length > 0;
    });

    this.subscriptions.push(moodSub);
    await this.loadWeeklyMoodStats();
  }

  async loadWeeklyMoodStats() {
    try {
      const request = await this.moodService.getMoodTrends('week');

      request.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.weeklyMoodCount = response.data.daily_trend.length;
            this.weeklyMoodAverage = parseFloat(response.data.average_intensity.toFixed(1));
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

  async loadBalanceData() {
    this.todayBalanceRegistered = await this.balanceService.hasTodayBalance();
  }

  async loadWellnessData() {
    try {
      const tipRequest = await this.wellnessService.getDailyTip();

      tipRequest.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.dailyTip = response.data.tip;
          }
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }

    await this.wellnessService.loadUserChallenges(false);

    const challengesSub = this.wellnessService.userChallenges$.subscribe(challenges => {
      this.activeChallenges = challenges.filter(c => !c.is_completed);
    });

    this.subscriptions.push(challengesSub);

    await this.wellnessService.loadUserPoints();

    const pointsSub = this.wellnessService.userPoints$.subscribe(points => {
      this.userPoints = points || undefined;
    });

    this.subscriptions.push(pointsSub);
  }

  getCurrentGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días ☀️';
    if (hour < 18) return 'Buenas tardes 🌤️';
    return 'Buenas noches 🌙';
  }

  goToHabits() {
    this.router.navigate(['/habits/list']);
  }

  goToTasks() {
    this.router.navigate(['/tasks/list']);
  }

  goToMood() {
    this.router.navigate(['/mood/list']);
  }

  goToBalance() {
    this.router.navigate(['/balance/daily']);
  }

  goToTips() {
    this.router.navigate(['/wellness/tips']);
  }

  goToChallenges() {
    this.router.navigate(['/wellness/challenges']);
  }

  goToAchievements() {
    this.router.navigate(['/wellness/achievements']);
  }

  goToCreateHabit() {
    this.router.navigate(['/habits/create']);
  }

  goToCreateTask() {
    this.router.navigate(['/tasks/create']);
  }

  goToCreateMood() {
    this.router.navigate(['/mood/create']);
  }

  goToChallengeDetail(challengeId: number) {
    this.router.navigate(['/wellness/challenge-detail', challengeId]);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
