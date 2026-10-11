import { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Info,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSettings, saveSettings } from '@/lib/storage';
import { testConnection } from '@/lib/ai-provider';
import {
  PROVIDER_CONFIGS,
  PROVIDER_MODELS,
  type ProviderType,
  type IApiSettings,
} from '@/data/types';

const PROVIDER_KEY_URLS: Record<ProviderType, string> = {
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/apikey',
  deepseek: 'https://platform.deepseek.com/api_keys',
  zhipu: 'https://open.bigmodel.cn/usercenter/apikeys',
  siliconflow: 'https://cloud.siliconflow.cn/account/ak',
  custom: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<IApiSettings>(getSettings());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { ok: boolean; msg: string }>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const update = <K extends keyof IApiSettings>(key: K, value: IApiSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleProviderChange = (provider: ProviderType) => {
    const cfg = PROVIDER_CONFIGS[provider];
    setSettings((prev) => ({
      ...prev,
      provider,
      baseURL: cfg.defaultBaseURL,
      model: cfg.defaultModel,
    }));
    setTestResult(null);
  };

  const handleSave = () => {
    saveSettings(settings);
    toast.success('设置已保存');
  };

  const handleTest = async () => {
    if (!settings.apiKey.trim()) {
      toast.error('请先填写 API Key');
      return;
    }
    setTesting(true);
    setTestResult(null);
    saveSettings(settings);

    const result = await testConnection(settings);
    setTesting(false);

    if (result.ok) {
      setTestResult({ ok: true, msg: '连接成功，API 配置可用' });
      toast.success('连接成功');
    } else {
      setTestResult({
        ok: false,
        msg: result.error?.message || '连接失败',
      });
      toast.error('连接失败');
    }
  };

  const keyUrl = PROVIDER_KEY_URLS[settings.provider];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 服务商选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AI 服务商</CardTitle>
          <CardDescription>选择你要使用的大模型服务商</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>服务商</Label>
            <Select
              value={settings.provider}
              onValueChange={(v) => handleProviderChange(v as ProviderType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择服务商" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_CONFIGS) as ProviderType[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PROVIDER_CONFIGS[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk-..."
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {keyUrl && (
              <a
                href={keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                前往获取 API Key
              </a>
            )}
          </div>

          {settings.provider === 'custom' && (
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input
                value={settings.baseURL}
                onChange={(e) => update('baseURL', e.target.value)}
                placeholder="https://api.example.com/v1"
                className="text-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>模型</Label>
            <Select
              value={settings.model}
              onValueChange={(v) => update('model', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_MODELS[settings.provider].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 参数设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">生成参数</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature（创造性）</Label>
              <Badge variant="secondary">{settings.temperature.toFixed(1)}</Badge>
            </div>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[settings.temperature]}
              onValueChange={([v]) => update('temperature', v)}
            />
            <p className="text-xs text-muted-foreground">
              值越高输出越发散有创意，值越低越稳定确定
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>最大输出长度</Label>
              <Badge variant="secondary">{settings.maxTokens}</Badge>
            </div>
            <Slider
              min={256}
              max={8192}
              step={256}
              value={[settings.maxTokens]}
              onValueChange={([v]) => update('maxTokens', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {testResult && (
        <Alert variant={testResult.ok ? 'success' : 'destructive'}>
          {testResult.ok ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          <AlertTitle>{testResult.ok ? '连接正常' : '连接失败'}</AlertTitle>
          <AlertDescription>{testResult.msg}</AlertDescription>
        </Alert>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSave}>
          <Save className="size-4" />
          保存设置
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          测试连接
        </Button>
      </div>

      {/* 隐私说明 */}
      <Alert>
        <Shield className="size-4" />
        <AlertTitle>隐私与安全</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>API Key 仅保存在你的浏览器本地（localStorage），不会上传到任何服务器。</p>
          <p>请求直接从浏览器发送到对应 AI 服务商。</p>
        </AlertDescription>
      </Alert>

      <Alert variant="info">
        <Info className="size-4" />
        <AlertTitle>关于 CORS</AlertTitle>
        <AlertDescription>
          部分服务商（如 OpenAI 官方）可能限制浏览器直接调用。如遇连接失败，建议使用
          DeepSeek、硅基流动等支持浏览器跨域调用的服务，或自建代理。
        </AlertDescription>
      </Alert>
    </div>
  );
}
