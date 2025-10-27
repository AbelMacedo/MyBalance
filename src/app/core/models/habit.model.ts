export interface HabitCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at?: string;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  icon: string;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  frequency: 'daily' | 'specific_days' | 'weekly';
  specific_days?: string[];
  priority: 'high' | 'medium' | 'low';
  target_count: number;
  is_active: boolean;
  is_paused: boolean;
  current_streak?: number;
  longest_streak?: number;
  last_completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  icon?: string;
  category_id?: number;
  frequency?: 'daily' | 'specific_days' | 'weekly';
  specific_days?: string[];
  priority?: 'high' | 'medium' | 'low';
  target_count?: number;
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  icon?: string;
  category_id?: number;
  frequency?: 'daily' | 'specific_days' | 'weekly';
  specific_days?: string[];
  priority?: 'high' | 'medium' | 'low';
  target_count?: number;
  is_active?: boolean;
  is_paused?: boolean;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  user_id: number;
  completion_date: string;
  completion_time: string;
  status: 'completed' | 'partial' | 'skipped';
  notes?: string;
  created_at: string;
}

export interface CompleteHabitRequest {
  habit_id: number;
  completion_date?: string;
  status?: 'completed' | 'partial' | 'skipped';
  notes?: string;
}

export interface HabitStats {
  total_completions: number;
  status_breakdown: {
    status: string;
    count: number;
  }[];
  current_streak: number;
  longest_streak: number;
  completion_days: {
    completion_date: string;
    status: string;
  }[];
}

export interface ApiHabitResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
