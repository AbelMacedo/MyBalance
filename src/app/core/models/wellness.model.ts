export interface WellnessCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at?: string;
}

export interface WellnessTip {
  id: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  title: string;
  content: string;
  author?: string;
  source?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time?: number;
  is_active: boolean;
  created_at: string;
}

export interface Challenge {
  id: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  duration_days: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: number;
  user_id: number;
  challenge_id: number;
  title: string;
  description: string;
  type: string;
  duration_days: number;
  difficulty: string;
  points: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  completed_at?: string;
  current_streak: number;
  progress_percentage: number;
  days_remaining: number;
  created_at: string;
}

export interface ChallengeProgress {
  user_challenge_id: number;
  progress_date: string;
  is_completed: boolean;
  notes?: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  is_unlocked?: boolean;
  unlocked_at?: string;
  created_at: string;
}

export interface UserRanking {
  user_id: number;
  full_name: string;
  avatar_url: string;
  total_points: number;
  level: number;
  rank: number;
}

export interface UserPoints {
  id: number;
  user_id: number;
  total_points: number;
  level: number;
  current_level_points: number;
  points_to_next_level: number;
  updated_at: string;
}

export interface ApiWellnessResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
