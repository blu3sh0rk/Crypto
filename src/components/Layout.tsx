import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-blue-600 flex items-center gap-2">
            <span>📚</span>
            <span>刷题系统</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">首页</Link>
            <Link to="/questions" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">题库</Link>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              退出
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-2 py-4 sm:px-4 sm:py-6">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>&copy; 2025 在线刷题系统. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
