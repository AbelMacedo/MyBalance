import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guards';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/auth/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/auth/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./pages/auth/forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'habits',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadChildren: () => import('./pages/habits/habit-list/habit-list.module').then(m => m.HabitListPageModule)
      },
      {
        path: 'create',
        loadChildren: () => import('./pages/habits/habit-create/habit-create.module').then(m => m.HabitCreatePageModule)
      },
      {
        path: 'edit/:id',
        loadChildren: () => import('./pages/habits/habit-edit/habit-edit.module').then(m => m.HabitEditPageModule)
      },
      {
        path: 'detail/:id',
        loadChildren: () => import('./pages/habits/habit-detail/habit-detail.module').then(m => m.HabitDetailPageModule)
      }
    ]
  },
  {
    path: 'mood',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadChildren: () => import('./pages/mood/mood-list/mood-list.module').then(m => m.MoodListPageModule)
      },
      {
        path: 'create',
        loadChildren: () => import('./pages/mood/mood-create/mood-create.module').then(m => m.MoodCreatePageModule)
      },
      {
        path: 'detail/:id',
        loadChildren: () => import('./pages/mood/mood-detail/mood-detail.module').then(m => m.MoodDetailPageModule)
      },
      {
        path: 'stats',
        loadChildren: () => import('./pages/mood/mood-stats/mood-stats.module').then(m => m.MoodStatsPageModule)
      }
    ]
  },
  {
    path: 'tasks',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadChildren: () => import('./pages/tasks/task-list/task-list.module').then(m => m.TaskListPageModule)
      },
      {
        path: 'create',
        loadChildren: () => import('./pages/tasks/task-create/task-create.module').then(m => m.TaskCreatePageModule)
      },
      {
        path: 'detail/:id',
        loadChildren: () => import('./pages/tasks/task-detail/task-detail.module').then(m => m.TaskDetailPageModule)
      }
    ]
  },
  {
    path: 'balance',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'daily',
        pathMatch: 'full'
      },
      {
        path: 'daily',
        loadChildren: () => import('./pages/balance/daily-balance/daily-balance.module').then(m => m.DailyBalancePageModule)
      }
    ]
  },
  {
    path: 'wellness',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'tips',
        pathMatch: 'full'
      },
      {
        path: 'tips',
        loadChildren: () => import('./pages/wellness/tips/tips.module').then(m => m.TipsPageModule)
      },
      {
        path: 'challenges',
        loadChildren: () => import('./pages/wellness/challenges/challenges.module').then(m => m.ChallengesPageModule)
      },
      {
        path: 'challenge-detail/:id',
        loadChildren: () => import('./pages/wellness/challenge-detail/challenge-detail.module').then(m => m.ChallengeDetailPageModule)
      },
      {
        path: 'achievements',
        loadChildren: () => import('./pages/wellness/achievements/achievements.module').then(m => m.AchievementsPageModule)
      }
    ]
  },
  {
    path: 'reset-password',
    loadChildren: () => import('./pages/auth/reset-password/reset-password.module').then( m => m.ResetPasswordPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
