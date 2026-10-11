import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Loader2,
  AlertCircle,
  User,
  Bot,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getSettings, hasApiKey, getCurrentCompare, setCurrentCompare } from '@/lib/storage';
import { streamChat, type AiError } from '@/lib/ai-provider';
import type { ICompareSession } from '@/data/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ComparePage() {
  const location = useLocation();
  const passedState = location.state as Partial<ICompareSession> | null;

  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [testInput, setTestInput] = useState('');
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
  const [isLoadingOptimized, setIsLoadingOptimized] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  const [originalChat, setOriginalChat] = useState<ChatMessage[]>([]);
  const [optimizedChat, setOptimizedChat] = useState<ChatMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化：从路由参数或本地存储恢复
  useEffect(() => {
    if (passedState?.originalPrompt && passedState?.optimizedPrompt) {
      setOriginalPrompt(passedState.originalPrompt);
      setOptimizedPrompt(passedState.optimizedPrompt);
    } else {
      const saved = getCurrentCompare();
      if (saved) {
        setOriginalPrompt(saved.originalPrompt);
        setOptimizedPrompt(saved.optimizedPrompt);
      }
    }
  }, [passedState]);

  useEffect(() => {
    if (originalPrompt && optimizedPrompt) {
      setCurrentCompare({ originalPrompt, optimizedPrompt });
    }
  }, [originalPrompt, optimizedPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [originalChat, optimizedChat]);

  const runTest = async (which: 'original' | 'optimized') => {
    if (!testInput.trim()) {
      toast.error('请输入测试内容');
      return;
    }
    if (!hasApiKey()) {
      toast.error('请先在设置中配置 API Key');
      return;
    }

    const systemPrompt = which === 'original' ? originalPrompt : optimizedPrompt;
    const setLoading = which === 'original' ? setIsLoadingOriginal : setIsLoadingOptimized;
    const setChat = which === 'original' ? setOriginalChat : setOptimizedChat;

    setLoading(true);
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: testInput };
    setChat((prev) => [...prev, userMsg]);

    const settings = getSettings();
    let result = '';

    // 先插入空的 assistant 消息
    setChat((prev) => [...prev, { role: 'assistant', content: '' }]);

    await streamChat(
      settings,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testInput },
      ],
      {
        onDelta: (text) => {
          result += text;
          setChat((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: result };
            return next;
          });
        },
        onDone: () => setLoading(false),
        onError: (err) => {
          setLoading(false);
          setError(err);
          // 移除空的 assistant 消息
          setChat((prev) => {
            const next = [...prev];
            if (next[next.length - 1]?.content === '') {
              next.pop();
            }
            return next;
          });
          toast.error('请求失败');
        },
      },
    );
  };

  const handleRunBoth = async () => {
    if (!testInput.trim()) {
      toast.error('请输入测试内容');
      return;
    }
    await Promise.all([runTest('original'), runTest('optimized')]);
  };

  const clearChat = () => {
    setOriginalChat([]);
    setOptimizedChat([]);
    setTestInput('');
    setError(null);
  };

  if (!originalPrompt || !optimizedPrompt) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 py-24 text-center">
        <ArrowLeftRight className="size-12 text-muted-foreground/50" />
        <div>
          <p className="font-medium">暂无对比内容</p>
          <p className="mt-1 text-sm text-muted-foreground">
            请先在优化页面完成提示词优化
          </p>
        </div>
        <Button variant="outline" onClick={() => history.back()}>
          返回优化
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* 提示词概要 */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="py-3">
          <CardContent className="px-3">
            <Badge variant="secondary" className="mb-1">原始</Badge>
            <p className="line-clamp-3 text-xs text-muted-foreground">
              {originalPrompt}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 py-3">
          <CardContent className="px-3">
            <Badge className="mb-1">优化后</Badge>
            <p className="line-clamp-3 text-xs text-muted-foreground">
              {optimizedPrompt}
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{error.message}</AlertTitle>
          <AlertDescription>{error.suggestion}</AlertDescription>
        </Alert>
      )}

      {/* 对话对比区 */}
      <div ref={scrollRef} className="grid grid-cols-2 gap-2">
        <ChatColumn
          title="原始提示词"
          messages={originalChat}
          isLoading={isLoadingOriginal}
          variant="secondary"
        />
        <ChatColumn
          title="优化后提示词"
          messages={optimizedChat}
          isLoading={isLoadingOptimized}
          variant="default"
        />
      </div>

      {/* 输入区 */}
      <div className="sticky bottom-0 space-y-2 border-t border-border/40 bg-background/95 pt-3 backdrop-blur-md">
        <Textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="输入测试问题，对比两种提示词的效果..."
          className="min-h-[60px] resize-none text-sm"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => runTest('original')}
            disabled={isLoadingOriginal || isLoadingOptimized}
          >
            {isLoadingOriginal ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            测原始
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleRunBoth}
            disabled={isLoadingOriginal || isLoadingOptimized}
          >
            {isLoadingOriginal || isLoadingOptimized ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            同时对比
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => runTest('optimized')}
            disabled={isLoadingOriginal || isLoadingOptimized}
          >
            {isLoadingOptimized ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            测优化
          </Button>
        </div>
        {(originalChat.length > 0 || optimizedChat.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={clearChat}
          >
            <Trash2 className="size-3.5" />
            清空对话
          </Button>
        )}
      </div>
    </div>
  );
}

function ChatColumn({
  title,
  messages,
  isLoading,
  variant,
}: {
  title: string;
  messages: ChatMessage[];
  isLoading: boolean;
  variant: 'secondary' | 'default';
}) {
  return (
    <Card className={variant === 'default' ? 'border-primary/30' : ''}>
      <CardHeader className="border-b bg-muted/30 py-2">
        <CardTitle className="text-center text-xs font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-2">
        {messages.length === 0 && !isLoading && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            等待测试...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                msg.role === 'user'
                  ? 'bg-secondary text-secondary-foreground'
                  : variant === 'default'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="size-3" />
              ) : (
                <Bot className="size-3" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-lg px-2 py-1 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/50'
              }`}
            >
              {msg.content || (
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
