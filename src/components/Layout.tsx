import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';

export const Layout = () => {
  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-muted/30 py-4 md:py-8">
      {/* 手机容器 */}
      <div className="relative flex w-full max-w-[390px] flex-col overflow-hidden bg-background shadow-2xl md:h-[844px] md:max-h-[90vh] md:rounded-[40px] md:border-[10px] md:border-foreground/5">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
};
