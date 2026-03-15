import { QuestionListResponse, QuizResult, Stats } from './types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const fetchStats = async (): Promise<Stats> => {
  const res = await fetch(`${API_BASE}/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

export const fetchQuestions = async (page = 1, limit = 20, category?: string, favorites_only = false, wrong_only = false): Promise<QuestionListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (category) params.append('category', category);
  if (favorites_only) params.append('favorites_only', 'true');
  if (wrong_only) params.append('wrong_only', 'true');

  const res = await fetch(`${API_BASE}/questions?${params.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
};

export const submitQuiz = async (answers: { question_id: number; user_answer: string }[]): Promise<QuizResult> => {
  const res = await fetch(`${API_BASE}/quiz/submit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit quiz');
  return res.json();
};

export const toggleFavorite = async (questionId: number): Promise<{ is_favorite: boolean }> => {
  const res = await fetch(`${API_BASE}/questions/${questionId}/favorite`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
};

export const recordWrong = async (questionId: number): Promise<{ wrong_count: number }> => {
  const res = await fetch(`${API_BASE}/questions/${questionId}/wrong`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to record wrong answer');
  return res.json();
};

export const recordAnswer = async (questionId: number, userAnswer: string, isCorrect: boolean): Promise<void> => {
  const res = await fetch(`${API_BASE}/questions/${questionId}/answer`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
    },
    body: JSON.stringify({ user_answer: userAnswer, is_correct: isCorrect })
  });
  if (!res.ok) throw new Error('Failed to record answer');
};
