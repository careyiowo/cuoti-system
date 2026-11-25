import { Link, NavLink, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BookOpen, CirclePlus, PencilRuler, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { path: '/', label: '题库', icon: BookOpen },
  { path: '/upload', label: '收集错题', icon: CirclePlus },
  { path: '/practice', label: '开始练习', icon: PencilRuler },
  { path: '/settings', label: '设置', icon: Settings2 },
];

export const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:gap-7">
          <Link to="/" className="flex shrink-0 items-baseline gap-2">
            <span className="font-serif text-lg leading-none tracking-tight text-foreground">错题本</span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:inline">
            KAOYAN
            </span>
          </Link>
          <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[13px] transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <item.icon className="size-3.5" strokeWidth={1.75} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border py-5">
        <div className="mx-auto max-w-6xl px-4 text-[11px] text-muted-foreground">
          数据保存在这台电脑的浏览器里，换设备或换浏览器不会同步
        </div>
      </footer>
      <Toaster position="top-center" />
    </div>
  );
};
