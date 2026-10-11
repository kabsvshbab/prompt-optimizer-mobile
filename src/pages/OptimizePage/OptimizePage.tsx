import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Save,
  Loader2,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  getSettings,
  hasApiKey,
  addHistory,
  addFavorite,
  isFavorited,
  getCurrentOptimize,
  setCurrentOptimize,
} from '@/lib/storage';
import {
  streamChat,
  getOptimizeSystemPrompt,
  getIterateSystemPrompt,
  type AiError,
} from '@/lib/ai-provider';
import { generateId } from '@/lib/utils';
import type { PromptMode, IOptimizeSession } from '@/data/types';

export default function OptimizePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PromptMode>('user');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [copied, setCopied] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [iteration, setIteration] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // 恢复上次会话
  useEffect(() => {
    const saved = getCurrentOptimize();
    if (saved) {
      setMode(saved.mode);
      setOriginalPrompt(saved.originalPrompt);
      setOptimizedPrompt(saved.optimizedPrompt);
      setIteration(saved.currentIteration);
      if (saved.optimizedPrompt) {
        setFavorited(isFavorited(saved.optimizedPrompt));
      }
    }
  }, []);

  // 自动保存草稿
  useEffect(() => {
    if (originalPrompt || optimizedPrompt) {
      const session: IOptimizeSession = {
        originalPrompt,
        optimizedPrompt,
        mode,
        iterations: [],
        currentIteration: iteration,
      };
      setCurrentOptimize(session);
    }
  }, [originalPrompt, optimizedPrompt, mode, iteration]);

  // 检查是否配置了 API Key
  useEffect(() => {
    if (!hasApiKey()) {
      // 不阻断，只在操作时提示
    }
  }, []);

  const handleOptimize = async (isIteration = false) => {
    if (!originalPrompt.trim()) {
      toast.error('请输入需要优化的提示词');
      return;
    }

    if (!hasApiKey()) {
      toast.error('请先在设置中配置 API Key');
      navigate('/settings');
      return;
    }

    setIsLoading(true);
    setError(null);

    const settings = getSettings();
    let result = '';

    const messages = isIteration
      ? [
          { role: 'system' as const, content: getIterateSystemPrompt() },
          {
            role: 'user' as const,
            content: `当前提示词：\n${optimizedPrompt}\n\n请进一步优化这个提示词，使其更加完善。`,
          },
        ]
      : [
          { role: 'system' as const, content: getOptimizeSystemPrompt(mode) },
          { role: 'user' as const, content: originalPrompt },
        ];

    await streamChat(settings, messages, {
      onDelta: (text) => {
        result += text;
        setOptimizedPrompt(result);
      },
      onDone: () => {
        setIsLoading(false);
        const newIteration = isIteration ? iteration + 1 : 1;
        setIteration(newIteration);
        setFavorited(false);

        // 保存到历史
        addHistory({
          id: generateId(),
          mode,
          originalPrompt: isIteration ? optimizedPrompt : originalPrompt,
          optimizedPrompt: result,
          iteration: newIteration,
          createdAt: Date.now(),
        });

        toast.success(isIteration ? '迭代优化完成' : '优化完成');

        // 滚动到结果
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      onError: (err) => {
        setIsLoading(false);
        setError(err);
        toast.error('优化失败');
      },
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(optimizedPrompt);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleFavorite = () => {
    if (!optimizedPrompt) return;
    if (favorited) {
      toast.info('已在收藏列表中');
      return;
    }
    addFavorite({
      id: generateId(),
      title: originalPrompt.slice(0, 30) || '未命名提示词',
      content: optimizedPrompt,
      mode,
      tags: [`第${iteration}轮优化`],
      createdAt: Date.now(),
    });
    setFavorited(true);
    toast.success('已收藏');
  };

  const handleReset = () => {
    setOriginalPrompt('');
    setOptimizedPrompt('');
    setIteration(0);
    setError(null);
    setFavorited(false);
    setCurrentOptimize(null);
  };

  const goCompare = () => {
    if (!optimizedPrompt) {
      toast.error('请先完成提示词优化');
      return;
    }
    navigate('/compare', {
      state: { originalPrompt, optimizedPrompt },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 模式切换 */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as PromptMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">用户提示词</TabsTrigger>
          <TabsTrigger value="system">系统提示词</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 未配置提示 */}
      {!hasApiKey() && (
        <Alert variant="warning">
          <AlertCircle className="size-4" />
          <AlertTitle>尚未配置 API</AlertTitle>
          <AlertDescription>
            <button
              className="underline"
              onClick={() => navigate('/settings')}
            >
              前往设置
            </button>
            {' '}配置 API Key 后即可使用
          </AlertDescription>
        </Alert>
      )}

      {/* 输入区 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              1
            </span>
            输入原始提示词
          </CardTitle>
          <CardDescription>
            {mode === 'user'
              ? '写下你想对 AI 说的话，我来帮你优化'
              : '描述你希望 AI 扮演的角色和行为规范'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            placeholder={
              mode === 'user'
                ? '例如：帮我写一份产品介绍...'
                : '例如：你是一位专业的产品经理助手...'
            }
            className="min-h-[140px] resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {originalPrompt.length} 字
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/library')}
            >
              <BookOpen className="size-3.5" />
              从模板选择
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => handleOptimize(false)}
          disabled={isLoading || !originalPrompt.trim()}
        >
          {isLoading && iteration === 0 ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              优化中...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              {iteration > 0 ? '重新优化' : '一键优化'}
            </>
          )}
        </Button>
        {iteration > 0 && (
          <Button
            variant="outline"
            onClick={() => handleOptimize(true)}
            disabled={isLoading}
          >
            {isLoading && iteration > 0 ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            迭代优化
          </Button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{error.message}</AlertTitle>
          <AlertDescription className="whitespace-pre-line">
            {error.suggestion}
          </AlertDescription>
        </Alert>
      )}

      {/* 结果区 */}
      {optimizedPrompt && (
        <Card ref={resultRef}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-6 items-center justify-center rounded-md bg-success/10 text-success">
                  2
                </span>
                优化结果
              </CardTitle>
              {iteration > 0 && (
                <Badge variant="secondary">第 {iteration} 轮</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {optimizedPrompt}
                {isLoading && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
                )}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={isLoading}
              >
                {copied ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                复制
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFavorite}
                disabled={isLoading || favorited}
              >
                <Save className="size-3.5" />
                {favorited ? '已收藏' : '收藏'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={goCompare}
                disabled={isLoading}
                className="col-span-2"
              >
                对比测试
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 重置 */}
      {(originalPrompt || optimizedPrompt) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="mx-auto text-muted-foreground"
        >
          <RotateCcw className="size-3.5" />
          清空重来
        </Button>
      )}
    </div>
  );
}
