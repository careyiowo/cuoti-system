import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, PlugZap, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadAiSettings, saveAiSettings, type IAiSettings } from '@/lib/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<IAiSettings>(loadAiSettings);
  const [testing, setTesting] = useState(false);

  const patch = (part: Partial<IAiSettings>) => setSettings((prev) => ({ ...prev, ...part }));

  const save = () => {
    saveAiSettings({
      baseUrl: settings.baseUrl.trim(),
      apiKey: settings.apiKey.trim(),
      model: settings.model.trim(),
    });
    toast.success('已保存识别设置');
  };

  const test = async () => {
    const baseUrl = settings.baseUrl.trim();
    const apiKey = settings.apiKey.trim();
    const model = settings.model.trim();
    if (!baseUrl || !apiKey || !model) {
      toast.error('三项都要填：接口地址、API Key、模型名');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: '只回复两个字：可以' }],
          max_tokens: 16,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        toast.error(`连接失败（${res.status}）：${detail.slice(0, 120)}`);
        return;
      }
      const payload = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const text = String(payload.choices?.[0]?.message?.content ?? '').trim();
      toast.success(`连接成功，模型回了：${text.slice(0, 20)}`);
    } catch {
      toast.error('请求没发出去：这家接口可能不允许浏览器直连（跨域被拦），也可能网络不通');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-2xl tracking-tight text-foreground">设置</h1>
        <p className="text-[13px] text-muted-foreground">只影响错题识别，不影响已经存好的题</p>
      </header>

      <Card className="space-y-4 rounded-sm p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-foreground">识别用的视觉模型</span>
          <span className="text-[11px] text-muted-foreground">
            {settings.apiKey.trim() ? '已配置，可以识别' : '未配置，只能手动录入'}
          </span>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">接口地址（OpenAI 兼容格式）</Label>
          <Input
            value={settings.baseUrl}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">API Key</Label>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={(e) => patch({ apiKey: e.target.value })}
              placeholder="只存在这台电脑的浏览器里"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">模型名</Label>
            <Input
              value={settings.model}
              onChange={(e) => patch({ model: e.target.value })}
              placeholder="qwen3.7-plus"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={save}>
            <Save className="size-4" strokeWidth={1.75} />
            保存
          </Button>
          <Button variant="outline" onClick={test} disabled={testing}>
            {testing ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <PlugZap className="size-4" strokeWidth={1.75} />
            )}
            {testing ? '测试中' : '测试连接'}
          </Button>
        </div>
      </Card>

      <Card className="rounded-sm p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">怎么填</div>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-foreground">
          <li>
            默认模型 qwen3.7-plus：原生视觉模型，能直接看图，百炼免费额度里给了 100 万 tokens，够识别 150 道左右。
          </li>
          <li>
            免费额度用完后，把模型名换成 qwen3.8-flash：输入 0.8 元、输出 2.7 元每百万 tokens，每题不到一分钱，响应也更快。
          </li>
          <li>
            填好后点「测试连接」：返回成功说明地址、Key、模型名三样都通；报 404 多半是模型名写错，去百炼控制台核对可用的模型 ID。
          </li>
          <li>必须选能看图的模型。qwen-mt-lite（翻译）、gui-plus（界面操作）这类认不出题目，即使有免费额度也用不上。</li>
          <li>百炼和火山方舟允许浏览器直连；智谱的接口不放行跨域，直连会被拦，要用它得另配后端中转。</li>
          <li>Key 只写在当前浏览器的本地存储里，不会上传到任何地方，但不要在公用电脑上填。</li>
        </ul>
      </Card>

      <Card className="rounded-sm p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">数据在哪</div>
        <p className="mt-2 text-[13px] leading-6 text-foreground">
          题目、答案和图片都存在这台电脑当前浏览器的 IndexedDB 里。换电脑、换浏览器、或者清理浏览器数据都会看不到，
          需要多设备同步的话得另配一个后端服务。
        </p>
      </Card>
    </div>
  );
}
