import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats } from '../api';
import { Stats } from '../types';
import { BookOpen, Award, Zap } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          高效刷题，轻松过关
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          海量题库，智能练习，助你掌握核心知识点。
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link to="/questions" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-200">
            开始练习
          </Link>
        </div>
      </section>

      {stats && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
             <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><BookOpen className="w-6 h-6" /></div>
             <div>
               <p className="text-sm text-gray-500 font-medium">总题数</p>
               <p className="text-2xl font-bold text-gray-900">{stats.total_questions}</p>
             </div>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
             <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Zap className="w-6 h-6" /></div>
             <div>
               <p className="text-sm text-gray-500 font-medium">分类数量</p>
               <p className="text-2xl font-bold text-gray-900">{stats.categories.length}</p>
             </div>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
             <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Award className="w-6 h-6" /></div>
             <div>
               <p className="text-sm text-gray-500 font-medium">已练习</p>
               <p className="text-2xl font-bold text-gray-900">0</p>
             </div>
           </div>
        </section>
      )}
      
      <section>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">题库分类</h2>
            <Link to="/questions" className="text-blue-600 font-medium hover:underline">查看全部 &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.categories.map(cat => (
            <Link key={cat} to={`/questions?category=${encodeURIComponent(cat)}`} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">{cat}</h3>
              <p className="text-gray-500 text-sm">点击进入练习 &rarr;</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
