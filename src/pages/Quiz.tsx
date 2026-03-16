import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, HelpCircle, BookOpen, Star, Grid, Edit3, Save } from 'lucide-react';
import clsx from 'clsx';

export default function Quiz() {
  const navigate = useNavigate();
  const { 
    questions, 
    currentQuestionIndex, 
    userAnswers, 
    answerQuestion, 
    nextQuestion, 
    prevQuestion, 
    submit, 
    isSubmitting,
    quizResult,
    toggleFavorite,
    recordAnswer,
    jumpToQuestion
  } = useQuizStore();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/questions');
    }
  }, [questions, navigate]);

  useEffect(() => {
    if (quizResult) {
      navigate('/result');
    }
  }, [quizResult, navigate]);

  // Reset confirmed state when question changes
  useEffect(() => {
    const currentQ = questions[currentQuestionIndex];
    if (currentQ?.is_answered) {
        setIsConfirmed(true);
    } else {
        setIsConfirmed(false);
    }
    setNoteText(currentQ?.notes || '');
  }, [currentQuestionIndex, questions]);

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const total = questions.length;
  const progress = ((currentQuestionIndex + 1) / total) * 100;
  const selectedAnswer = userAnswers[currentQuestion.id];
  
  // Calculate correctness if confirmed
  const isCorrect = isConfirmed && selectedAnswer === currentQuestion.correct_answer;

  const handleOptionClick = (optionText: string) => {
    if (isConfirmed) return; // Prevent changing answer after confirmation
    const letter = optionText.split('.')[0].trim();
    answerQuestion(currentQuestion.id, letter);
  };

  const handleConfirm = () => {
    if (!selectedAnswer) return;
    setIsConfirmed(true);
    
    const isAnswerCorrect = selectedAnswer === currentQuestion.correct_answer;
    recordAnswer(currentQuestion.id, selectedAnswer, isAnswerCorrect);
  };

  const handleSaveNote = async () => {
      setIsSavingNote(true);
      await useQuizStore.getState().saveNote(currentQuestion.id, noteText);
      setIsSavingNote(false);
  };

  const answeredCount = questions.filter(q => q.is_answered).length;
  const correctCount = questions.filter(q => q.is_answered && q.user_answer === q.correct_answer).length;
  const wrongCount = questions.filter(q => q.is_answered && q.user_answer !== q.correct_answer).length;
  const unansweredCount = total - answeredCount;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 relative">
      {/* Question Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {currentQuestionIndex + 1} / {total}
          </span>
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
            {currentQuestion.category || '未分类'}
          </span>
          {currentQuestion.wrong_count > 0 && (
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                曾错 {currentQuestion.wrong_count} 次
            </span>
          )}
        </div>
        <div className="mb-5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">
            {currentQuestion.content}
          </h2>
        </div>

        <div className="space-y-2.5">
          {currentQuestion.options.map((option) => {
             const letter = option.split('.')[0].trim();
             const isSelected = selectedAnswer === letter;
             
             // Determine style based on confirmation state
             let buttonStyle = "border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700";
             let iconStyle = "border-gray-300 text-gray-500 group-hover:border-blue-400";
             
             if (isSelected) {
               if (isConfirmed) {
                 if (isCorrect) {
                   buttonStyle = "border-green-500 bg-green-50 text-green-700";
                   iconStyle = "bg-green-500 border-green-500 text-white";
                 } else {
                   buttonStyle = "border-red-500 bg-red-50 text-red-700";
                   iconStyle = "bg-red-500 border-red-500 text-white";
                 }
               } else {
                 buttonStyle = "border-blue-600 bg-blue-50 text-blue-700";
                 iconStyle = "bg-blue-600 border-blue-600 text-white";
               }
             } else if (isConfirmed && letter === currentQuestion.correct_answer) {
               // Highlight correct answer if user chose wrong
               buttonStyle = "border-green-500 bg-green-50 text-green-700";
               iconStyle = "bg-green-500 border-green-500 text-white";
             }

             return (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                disabled={isConfirmed}
                className={clsx(
                  "w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 group",
                  buttonStyle,
                  isConfirmed && "cursor-default"
                )}
              >
                <div className={clsx(
                  "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors shrink-0",
                  iconStyle
                )}>
                  {letter}
                </div>
                <span className="font-medium text-sm sm:text-base">{option.substring(option.indexOf('.') + 1).trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer Analysis (Visible after confirmation) */}
      {isConfirmed && (
        <div className={clsx(
          "p-6 rounded-2xl border shadow-sm animate-fade-in",
          isCorrect ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
        )}>
          <div className="flex items-start gap-3 mb-4">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={clsx(
                "font-bold text-lg mb-1",
                isCorrect ? "text-green-800" : "text-red-800"
              )}>
                {isCorrect ? "回答正确" : "回答错误"}
              </h3>
              {!isCorrect && (
                <p className="text-red-700 font-medium">
                  正确答案是：{currentQuestion.correct_answer}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200/50">
            {currentQuestion.source && (
              <div className="flex gap-3">
                <BookOpen className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-semibold text-gray-700 mb-1">新题依据</span>
                  <p className="text-gray-600 text-sm leading-relaxed">{currentQuestion.source}</p>
                </div>
              </div>
            )}
            
            {currentQuestion.explanation && (
              <div className="flex gap-3">
                <HelpCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-semibold text-gray-700 mb-1">解析/备注</span>
                  <p className="text-gray-600 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Section (Visible after confirmation) */}
      {isConfirmed && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-800">我的笔记</h3>
          </div>
          <div className="relative">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="在这里记录你的想法或解题思路..."
              className="w-full min-h-[120px] p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-y transition-all text-gray-700 bg-gray-50/50 focus:bg-white"
            />
            <button
              onClick={handleSaveNote}
              disabled={isSavingNote || noteText === (currentQuestion.notes || '')}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {isSavingNote ? '保存中...' : (noteText === (currentQuestion.notes || '') && noteText !== '' ? '已保存' : '保存笔记')}
            </button>
          </div>
        </div>
      )}

      {/* Answer Card Drawer */}
      <div className={clsx(
        "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out transform",
        showCard ? "translate-y-0" : "translate-y-full"
      )} style={{ maxHeight: '80vh' }}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="font-bold text-lg text-gray-800">答题卡 ({total}题)</h3>
            <button onClick={() => setShowCard(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <XCircle className="w-6 h-6 text-gray-500" />
            </button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 70px)' }}>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {questions.map((q, index) => {
                    let statusClass = "bg-gray-100 text-gray-600 border-gray-200";
                    if (q.is_answered) {
                        if (q.user_answer === q.correct_answer) {
                            statusClass = "bg-green-100 text-green-700 border-green-200";
                        } else {
                            statusClass = "bg-red-100 text-red-700 border-red-200";
                        }
                    }
                    if (index === currentQuestionIndex) {
                        statusClass += " ring-2 ring-blue-500 ring-offset-2";
                    }

                    return (
                        <button
                            key={q.id}
                            onClick={() => {
                                jumpToQuestion(index);
                                setShowCard(false);
                            }}
                            className={clsx(
                                "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-all",
                                statusClass
                            )}
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>
            
            <div className="mt-6 flex gap-4 justify-center text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div> 未答 ({unansweredCount})
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div> 答对 ({correctCount})
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div> 答错 ({wrongCount})
                </div>
            </div>
        </div>
      </div>

      {/* Overlay for Drawer */}
      {showCard && (
        <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowCard(false)}
        />
      )}

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">上一题</span>
            </button>
            <button
                onClick={() => toggleFavorite(currentQuestion.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                title={currentQuestion.is_favorite ? "取消收藏" : "收藏题目"}
            >
                <Star 
                    className={clsx(
                        "w-5 h-5 transition-all",
                        currentQuestion.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400 group-hover:text-yellow-400"
                    )} 
                />
                <span className="hidden sm:inline">{currentQuestion.is_favorite ? '已收藏' : '收藏'}</span>
            </button>
          </div>

          <div className="flex gap-2 flex-1 justify-end sm:justify-center max-w-xs">
            <button
                onClick={() => setShowCard(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
                <Grid className="w-5 h-5" />
                <span className="hidden sm:inline">答题卡</span>
            </button>

            {!isConfirmed ? (
                <button
                onClick={handleConfirm}
                disabled={!selectedAnswer}
                className="flex-1 flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-200 transition-all"
                >
                <CheckCircle className="w-5 h-5" />
                确认
                </button>
            ) : (
                currentQuestionIndex < total - 1 ? (
                <button
                    onClick={nextQuestion}
                    className="flex-1 flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all"
                >
                    下一题
                    <ChevronRight className="w-5 h-5" />
                </button>
                ) : (
                <button
                    onClick={submit}
                    disabled={isSubmitting}
                    className="flex-1 flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-70 shadow-lg hover:shadow-green-200 transition-all"
                >
                    {isSubmitting ? '提交...' : '完成'}
                    <CheckCircle className="w-5 h-5" />
                </button>
                )
            )}
          </div>
          
           <div className="w-[88px] sm:w-[100px] flex justify-end">
             {/* Optional: Skip button or just empty space to balance Prev button */}
           </div>
        </div>
      </div>
    </div>
  );
}
