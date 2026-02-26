import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  HelpCircle,
  Calendar,
  FolderTree,
  Library,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/questions', icon: HelpCircle, label: 'Утверждения' },
  { to: '/daily-sets', icon: Calendar, label: 'Ежедневные наборы' },
  { to: '/categories', icon: FolderTree, label: 'Категории' },
  { to: '/collections', icon: Library, label: 'Подборки' },
  { to: '/reference', icon: BookOpen, label: 'Никнеймы и аватары' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface-secondary">
      <aside className="w-60 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <h1 className="text-base font-semibold text-text-primary">Факт или Фейк</h1>
          <p className="text-xs text-text-secondary mt-0.5">Админ-панель</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:bg-red/10 hover:text-red transition-colors w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
