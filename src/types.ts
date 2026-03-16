export interface Question {
  id: number;
  q_type: string;
  category: string;
  content: string;
  options: string[];
  correct_answer?: string;
  explanation?: string;
  ai_explanation?: string;
  source?: string;
  is_favorite: boolean;
  wrong_count: number;
  is_answered: boolean;
  user_answer?: string;
  notes?: string;
}

export interface QuestionListResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
}

export interface QuizResult {
  score: number;
  correct_count: number;
  total_count: number;
  results: {
    question_id: number;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }[];
}

export interface Stats {
  total_questions: number;
  categories: string[];
}
