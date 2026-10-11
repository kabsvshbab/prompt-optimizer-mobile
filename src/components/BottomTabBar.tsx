import { NavLink, useLocation } from 'react-router-dom';
import { Sparkles, GitCompare, Library, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAB_ITEMS = [
  { path: '/', label: '优化', icon: Sparkles, end: true },
  { path: '/compare', label: '对比测试', icon: GitCompare, end: false },
  { path: '/library', label: '提示词库', icon: Library, end: false },
  { path: '/settings', label: '设置', icon: Settings, end: false },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="flex h-16 shrink-0 items-stretch border-t border-border/60 bg-background/95 backdrop-blur-xl">
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.end
          ? pathname === '/'
          : pathname === item.path || pathname.startsWith(`${item.path}/`);

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
