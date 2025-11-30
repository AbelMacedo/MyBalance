export interface Emotion {
  id: number;
  name: string;
  emoji: string;
  color: string;
  category: 'positive' | 'neutral' | 'negative';
  created_at?: string;
}

export interface EmotionTag {
  id: number;
  name: string;
  icon: string;
  created_at?: string;
}

export interface MoodEntry {
  id: number;
  user_id: number;
  emotion_id: number;
  emotion_name?: string;
  emotion_emoji?: string;
  emotion_color?: string;
  emotion_category?: string;
  intensity: number; // 1-5
  note?: string;
  tags?: string[];
  tag_ids?: number[];
  tag_names?: string[];
  entry_date: string;
  entry_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMoodEntryRequest {
  emotion_id: number;
  intensity: number;
  note?: string;
  tag_ids?: number[];
  entry_date?: string;
  entry_time?: string;
}

export interface UpdateMoodEntryRequest {
  emotion_id?: number;
  intensity?: number;
  note?: string;
  tag_ids?: number[];
}

export interface MoodTrends {
  period: string;
  start_date: string;
  end_date: string;
  category_stats: {
    category: string;
    count: number;
    avg_intensity: number;
  }[];
  top_emotions: {
    name: string;
    emoji: string;
    color: string;
    category: string;
    count: number;
  }[];
  daily_trend: {
    entry_date: string;
    category: string;
    avg_intensity: number;
    count: number;
  }[];
  average_intensity: number;
}

export interface WeeklyMoodScore {
  current_week: {
    score: string;
    breakdown: {
      avg_intensity: number;
      category: string;
      count: number;
    }[];
  };
  previous_week: {
    score: string;
  };
  difference: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ApiMoodResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
