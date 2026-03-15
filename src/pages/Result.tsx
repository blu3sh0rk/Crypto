import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store';
import { Check, X, RefreshCw, List } from 'lucide-react';
import clsx from 'clsx';

export default function Result() {
  const navigate = useNavigate();
  const { quizResult, reset, questions } = useQuizStore();

  useEffect(() => {
    if (!quizResult) {
      navigate('/');
    }
  }, [quizResult, navigate]);

  if (!quizResult) return null;

  const handleRetry = () => {
    reset();
    navigate('/questions');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">练习结果</h1>
        <div className="flex justify-center items-end gap-2">
          <span className="text-5xl font-extrabold text-blue-600">{Math.round(quizResult.score)}</span>
          <span className="text-xl text-gray-500 mb-2">分</span>
        </div>
        <p className="text-gray-600">
          共 {quizResult.total_count} 题，答对 <span className="text-green-600 font-bold">{quizResult.correct_count}</span> 题
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={handleRetry} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-200">
            <RefreshCw className="w-4 h-4" />
            再练一次
          </button>
          <button onClick={() => { reset(); navigate('/questions'); }} className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <List className="w-4 h-4" />
            返回题库
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">题目解析</h2>
        {quizResult.results.map((result, idx) => {
          const question = questions.find(q => q.id === result.question_id);
          if (!question) return null;

          return (
            <div key={result.question_id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {result.is_correct ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <X className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-grow space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">
                      <span className="text-gray-400 mr-2">{idx + 1}.</span>
                      {question.content}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className={clsx("p-3 rounded-lg border", result.is_correct ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800")}>
                      <span className="font-semibold block mb-1">你的答案</span>
                      {result.user_answer || "未作答"}
                    </div>
                    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
                      <span className="font-semibold block mb-1">正确答案</span>
                      {result.correct_answer}
                    </div>
                  </div>

                  {result.explanation && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-1">解析：</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{result.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
