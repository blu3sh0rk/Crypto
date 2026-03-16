import { create } from 'zustand';
import { Question, QuizResult } from './types';
import { submitQuiz as apiSubmitQuiz, toggleFavorite as apiToggleFavorite, recordWrong as apiRecordWrong, recordAnswer as apiRecordAnswer, saveNote as apiSaveNote, fetchAiExplanation as apiFetchAiExplanation } from './api';

interface QuizState {
  questions: Question[];
  userAnswers: Record<number, string>;
  currentQuestionIndex: number;
  quizResult: QuizResult | null;
  isSubmitting: boolean;

  setQuestions: (questions: Question[]) => void;
  answerQuestion: (questionId: number, answer: string, isMultipleChoice?: boolean) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submit: () => Promise<void>;
  reset: () => void;
  jumpToQuestion: (index: number) => void;
  toggleFavorite: (questionId: number) => Promise<void>;
  markAsWrong: (questionId: number) => Promise<void>;
  recordAnswer: (questionId: number, userAnswer: string, isCorrect: boolean) => Promise<void>;
  saveNote: (questionId: number, notes: string) => Promise<void>;
  getAiExplanation: (questionId: number, forceRefresh?: boolean) => Promise<void>;
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
  answerQuestion: (qId, ans, isMultipleChoice) => set((state) => {
    // Fallback if not passed explicitly, but it's better to pass it from component
    // because `state.questions` might not be perfectly synchronized if filtered or modified externally
    const multipleChoice = isMultipleChoice !== undefined
      ? isMultipleChoice
      : /多选|多项/.test(`${state.questions.find(q => q.id === qId)?.q_type || ''}`);

    if (multipleChoice) {
      // Toggle logic for multiple choice
      let currentSelected = state.userAnswers[qId] || '';
      let newAnswer = '';
      
      // Since ans is the letter clicked (e.g., 'A')
      if (currentSelected.includes(ans)) {
          newAnswer = currentSelected.replace(ans, '');
      } else {
          newAnswer = currentSelected + ans;
      }
      
      // Sort alphabetically
      newAnswer = newAnswer.split('').sort().join('');
      return { userAnswers: { ...state.userAnswers, [qId]: newAnswer } };
    }

    // Default single choice logic
    return { userAnswers: { ...state.userAnswers, [qId]: ans } };
  }),
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
  },
  saveNote: async (questionId, notes) => {
      try {
          await apiSaveNote(questionId, notes);
          set((state) => ({
             questions: state.questions.map(q => 
                 q.id === questionId ? { ...q, notes } : q
             )
          }));
      } catch (error) {
          console.error(error);
      }
  },
  getAiExplanation: async (questionId, forceRefresh = false) => {
      try {
          const res = await apiFetchAiExplanation(questionId, forceRefresh);
          set((state) => ({
             questions: state.questions.map(q => 
                 q.id === questionId ? { ...q, ai_explanation: res.explanation } : q
             )
          }));
      } catch (error) {
          console.error(error);
      }
  }
}));
