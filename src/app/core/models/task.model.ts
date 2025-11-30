export interface TaskCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at?: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  priority: 'high' | 'medium' | 'low';
  estimated_time?: number; // Minutos
  task_date: string;
  is_completed: boolean;
  completed_at?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  reminder_enabled: boolean;
  reminder_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category_id?: number;
  priority?: 'high' | 'medium' | 'low';
  estimated_time?: number;
  task_date: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  reminder_enabled?: boolean;
  reminder_time?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category_id?: number;
  priority?: 'high' | 'medium' | 'low';
  estimated_time?: number;
  task_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  reminder_enabled?: boolean;
  reminder_time?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completion_rate: string;
  by_priority: {
    priority: string;
    count: number;
  }[];
  by_category: {
    category_name: string;
    count: number;
    completed: number;
  }[];
}

export interface DailyBalance {
  id: number;
  user_id: number;
  balance_date: string;
  what_went_well: string;
  what_to_improve: string;
  day_rating: number; // 1-5
  created_at: string;
  updated_at: string;
}

export interface CreateBalanceRequest {
  balance_date: string;
  what_went_well: string;
  what_to_improve: string;
  day_rating: number;
}

export interface BalanceHistory {
  balances: DailyBalance[];
  stats: {
    total_days: number;
    average_rating: string;
  };
}

export interface ApiTaskResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
