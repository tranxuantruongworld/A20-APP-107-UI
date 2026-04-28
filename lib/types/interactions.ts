export type InteractionType = 'qa' | 'poll' | 'survey' | 'assessment' | 'wordcloud';

export interface PollOption {
  id: string;
  text: string;
  emoji?: string;
}

export interface PollConfig {
  options: PollOption[];
  allow_multiple: boolean;
  show_results: 'live' | 'end' | 'hidden';
  anonymous: boolean;
}

export interface SurveyQuestion {
  key: string;
  text: string;
  type: 'text' | 'rating' | 'multiple_choice' | 'ranking';
  required: boolean;
  options?: string[];
}

export interface SurveyConfig {
  questions: SurveyQuestion[];
  allow_anonymous: boolean;
  show_results: boolean;
  allow_partial_submission: boolean;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string | number;
  explanation?: string;
}

export interface AssessmentConfig {
  questions: AssessmentQuestion[];
  show_correct_answer: 'after_submission' | 'end' | 'never';
  allow_retake: boolean;
  pass_threshold: number; // percentage
}

export interface WordCloudConfig {
  max_word_length: number;
  min_word_length: number;
  allow_duplicates: boolean;
  show_live: boolean;
}

export interface Interaction {
  id: string;
  seminar_id: string;
  type: InteractionType;
  title: string;
  description?: string;
  is_active: boolean;
  config: PollConfig | SurveyConfig | AssessmentConfig | WordCloudConfig;
  created_at: string;
  activated_at?: string;
  closed_at?: string;
  display_order: number;
}

export interface InteractionResponse {
  id: string;
  interaction_id: string;
  respondent_id?: string;
  respondent_name?: string;
  is_anonymous: boolean;
  created_at: string;
  data: Record<string, any>;
}

export interface InteractionAnalytics {
  total_responses: number;
  response_rate: number;
  unique_respondents: number;
  results: Record<string, any>;
}

export interface PresentationMaterial {
  id: string;
  seminar_id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}
