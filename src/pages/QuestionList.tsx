import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchQuestions, fetchStats } from '../api';
import { Question, Stats } from '../types';
import { useQuizStore } from '../store';
import { Filter, Play, Star, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function QuestionList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const setQuestionsStore = useQuizStore(state => state.setQuestions);
  
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const view = searchParams.get('view') || 'all'; // all, favorites, wrong
  const limit = 200; // Increased limit

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((error: Error & { status?: number }) => {
        if (error.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        console.error(error);
      });
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    const favoritesOnly = view === 'favorites';
    const wrongOnly = view === 'wrong';

    fetchQuestions(page, limit, category, favoritesOnly, wrongOnly).then(res => {
      setQuestions(res.questions);
      setTotal(res.total);
    }).catch((error: Error & { status?: number }) => {
        if (error.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        setQuestions([]);
        setTotal(0);
        setErrorMessage('题目加载失败，请确认后端服务已启动');
        console.error('Failed to fetch questions:', error);
    }).finally(() => setLoading(false));
  }, [page, category, view, navigate]);

  const handleStartQuiz = () => {
    if (questions.length === 0) return;
    if (view === 'wrong') {
      const retryQuestions = questions.map((q) => ({
        ...q,
        is_answered: false,
        user_answer: undefined
      }));
      setQuestionsStore(retryQuestions);
    } else {
      setQuestionsStore(questions);
    }
    navigate('/quiz');
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSearchParams({ category: val, page: '1', view });
  };

  const handleViewChange = (newView: string) => {
      setSearchParams({ category, page: '1', view: newView });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">题目列表</h1>
        <div className="flex flex-wrap gap-4">
            {/* View Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => handleViewChange('all')}
                    className={clsx(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        view === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    全部
                </button>
                <button
                    onClick={() => handleViewChange('favorites')}
                    className={clsx(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                        view === 'favorites' ? "bg-white text-yellow-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <Star className="w-3.5 h-3.5" />
                    收藏
                </button>
                <button
                    onClick={() => handleViewChange('wrong')}
                    className={clsx(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                        view === 'wrong' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <AlertCircle className="w-3.5 h-3.5" />
                    错题本
                </button>
            </div>

            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select 
                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={category}
                    onChange={handleCategoryChange}
                >
                    <option value="">所有分类</option>
                    {stats?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <button 
                onClick={handleStartQuiz}
                disabled={loading || questions.length === 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Play className="w-4 h-4" />
                开始练习 ({questions.length}题)
            </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : errorMessage ? (
        <div className="text-center py-12 text-red-500 bg-white rounded-xl border border-red-100">
          {errorMessage}
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map(q => (
            <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {q.category || '未分类'}
                    </span>
                    {q.is_favorite && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            已收藏
                        </span>
                    )}
                    {q.wrong_count > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 gap-1">
                            <AlertCircle className="w-3 h-3" />
                            错题 ({q.wrong_count})
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-400">ID: {q.id}</span>
              </div>
              <p className="text-gray-900 font-medium mb-4">{q.content}</p>
              <div className="space-y-2">
                {q.options.map((opt, idx) => (
                  <div key={idx} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {questions.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                  {view === 'favorites' ? '暂无收藏题目' : view === 'wrong' ? '暂无错题记录' : '暂无题目'}
              </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 py-4">
          <button 
            disabled={page <= 1}
            onClick={() => setSearchParams({ category, page: (page - 1).toString(), view })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
             第 {page} 页 / 共 {Math.ceil(total / limit)} 页
          </span>
          <button 
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setSearchParams({ category, page: (page + 1).toString(), view })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
