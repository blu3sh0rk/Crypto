import { create } from 'zustand';
import { Question, QuizResult } from './types';
import { submitQuiz as apiSubmitQuiz, toggleFavorite as apiToggleFavorite, recordWrong as apiRecordWrong, recordAnswer as apiRecordAnswer } from './api';

interface QuizState {
  questions: Question[];
  userAnswers: Record<number, string>;
  currentQuestionIndex: number;
  quizResult: QuizResult | null;
  isSubmitting: boolean;

  setQuestions: (questions: Question[]) => void;
  answerQuestion: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submit: () => Promise<void>;
  reset: () => void;
  jumpToQuestion: (index: number) => void;
  toggleFavorite: (questionId: number) => Promise<void>;
  markAsWrong: (questionId: number) => Promise<void>;
  recordAnswer: (questionId: number, userAnswer: string, isCorrect: boolean) => Promise<void>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  userAnswers: {},
  currentQuestionIndex: 0,
  quizResult: null,
  isSubmitting: false,

  setQuestions: (questions) => {
    const userAnswers: Record<number, string> = {};
    let firstUnansweredIndex = 0;
    let foundUnanswered = false;

    questions.forEach((q, index) => {
      if (q.user_answer) {
        userAnswers[q.id] = q.user_answer;
      } else if (!foundUnanswered) {
        firstUnansweredIndex = index;
        foundUnanswered = true;
      }
    });

    set({ 
      questions, 
      userAnswers, 
      currentQuestionIndex: firstUnansweredIndex, 
      quizResult: null 
    });
  },
  answerQuestion: (qId, ans) => set((state) => ({ userAnswers: { ...state.userAnswers, [qId]: ans } })),
  nextQuestion: () => set((state) => ({ currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1) })),
  prevQuestion: () => set((state) => ({ currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0) })),
  jumpToQuestion: (index) => set({ currentQuestionIndex: index }),
  submit: async () => {
    const { userAnswers } = get();
    set({ isSubmitting: true });
    try {
      const answers = Object.entries(userAnswers).map(([qId, ans]) => ({
        question_id: parseInt(qId),
        user_answer: ans,
      }));
      const result = await apiSubmitQuiz(answers);
      set({ quizResult: result });
    } catch (error) {
      console.error(error);
      alert('提交失败，请重试');
    } finally {
      set({ isSubmitting: false });
    }
  },
  reset: () => set({ questions: [], userAnswers: {}, currentQuestionIndex: 0, quizResult: null }),
  toggleFavorite: async (questionId) => {
    try {
      const res = await apiToggleFavorite(questionId);
      set((state) => ({
        questions: state.questions.map(q => 
          q.id === questionId ? { ...q, is_favorite: res.is_favorite } : q
        )
      }));
    } catch (error) {
      console.error(error);
    }
  },
  markAsWrong: async (questionId) => {
    try {
      await apiRecordWrong(questionId);
      set((state) => ({
        questions: state.questions.map(q => 
          q.id === questionId ? { ...q, wrong_count: q.wrong_count + 1 } : q
        )
      }));
    } catch (error) {
      console.error(error);
    }
  },
  recordAnswer: async (questionId, userAnswer, isCorrect) => {
      try {
          await apiRecordAnswer(questionId, userAnswer, isCorrect);
          set((state) => ({
             questions: state.questions.map(q => 
                 q.id === questionId ? { ...q, is_answered: true, user_answer: userAnswer, wrong_count: isCorrect ? q.wrong_count : q.wrong_count + 1 } : q
             )
          }));
      } catch (error) {
          console.error(error);
      }
  }
}));
