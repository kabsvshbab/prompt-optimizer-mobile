import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  History,
  FileText,
  Trash2,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  getFavorites,
  deleteFavorite,
  getHistory,
  deleteHistory,
  clearHistory,
  getTemplates,
  deleteTemplate,
  addCustomTemplate,
} from '@/lib/storage';
import { formatDate, generateId } from '@/lib/utils';
import type {
  IPromptFavoriteItem,
  IPromptHistoryItem,
  IPromptTemplate,
} from '@/data/types';

export default function LibraryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('favorites');
  const [favorites, setFavorites] = useState<IPromptFavoriteItem[]>([]);
  const [history, setHistory] = useState<IPromptHistoryItem[]>([]);
  const [templates, setTemplates] = useState<IPromptTemplate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = () => {
    setFavorites(getFavorites());
    setHistory(getHistory());
    setTemplates(getTemplates());
  };

  useEffect(() => {
    refresh();
  }, [tab]);

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success('已复制');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleUseTemplate = (content: string) => {
    // 跳转到优化页并填入（通过 sessionStorage 临时传递）
    sessionStorage.setItem('__use_template', content);
    navigate('/');
    toast.success('已填入优化页');
  };

  const handleDeleteFavorite = (id: string) => {
    deleteFavorite(id);
    refresh();
    toast.success('已删除');
  };

  const handleDeleteHistory = (id: string) => {
    deleteHistory(id);
    refresh();
    toast.success('已删除');
  };

  const handleClearHistory = () => {
    clearHistory();
    refresh();
    toast.success('历史已清空');
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    refresh();
    toast.success('模板已删除');
  };

  return (
    <div className="flex flex-col p-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="favorites" className="gap-1">
            <Heart className="size-3.5" />
            收藏
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="size-3.5" />
            历史
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1">
            <FileText className="size-3.5" />
            模板
          </TabsTrigger>
        </TabsList>

        {/* 收藏 */}
        <TabsContent value="favorites" className="mt-4 space-y-3">
          {favorites.length === 0 ? (
            <EmptyState icon={Heart} text="还没有收藏的提示词" />
          ) : (
            favorites.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-sm">
                      {item.title}
                    </CardTitle>
                    <div className="flex shrink-0 gap-1">
                      <IconButton
                        onClick={() => handleCopy(item.content, item.id)}
                      >
                        {copiedId === item.id ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </IconButton>
                      <IconButton onClick={() => handleDeleteFavorite(item.id)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </IconButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {item.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-1">
                      <Badge variant="outline">{item.mode === 'user' ? '用户' : '系统'}</Badge>
                      {item.tags.map((t) => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 历史 */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-destructive">
                  <Trash2 className="size-3.5" />
                  清空全部历史
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认清空？</AlertDialogTitle>
                  <AlertDialogDescription>
                    将删除全部 {history.length} 条历史记录，此操作不可恢复。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory}>
                    确认清空
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {history.length === 0 ? (
            <EmptyState icon={History} text="还没有优化历史" />
          ) : (
            history.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {item.mode === 'user' ? '用户' : '系统'}
                      </Badge>
                      <Badge variant="secondary">第{item.iteration}轮</Badge>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton
                        onClick={() => handleCopy(item.optimizedPrompt, item.id)}
                      >
                        {copiedId === item.id ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </IconButton>
                      <IconButton onClick={() => handleDeleteHistory(item.id)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </IconButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-1 text-[10px] text-muted-foreground">原始：</p>
                  <p className="mb-2 line-clamp-2 text-xs text-muted-foreground/80">
                    {item.originalPrompt}
                  </p>
                  <p className="mb-1 text-[10px] text-primary">优化后：</p>
                  <p className="line-clamp-3 text-xs">{item.optimizedPrompt}</p>
                  <p className="mt-2 text-right text-[10px] text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 模板 */}
        <TabsContent value="templates" className="mt-4 space-y-3">
          {templates.length === 0 ? (
            <EmptyState icon={FileText} text="暂无模板" />
          ) : (
            templates.map((tpl) => (
              <Card key={tpl.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {tpl.title}
                      {tpl.source === 'builtin' ? (
                        <Badge variant="secondary">内置</Badge>
                      ) : (
                        <Badge>自定义</Badge>
                      )}
                    </CardTitle>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleUseTemplate(tpl.content)}
                      >
                        <Plus className="size-3.5" />
                        使用
                      </Button>
                      {tpl.source === 'custom' && (
                        <IconButton onClick={() => handleDeleteTemplate(tpl.id)}>
                          <Trash2 className="size-3.5 text-destructive" />
                        </IconButton>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
                    {tpl.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IconButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
        <Icon className="size-8 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
