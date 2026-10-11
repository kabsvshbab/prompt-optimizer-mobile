import { Sparkles } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-center border-b border-border/40 bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          提示词优化器
        </span>
      </div>
    </header>
  );
}
