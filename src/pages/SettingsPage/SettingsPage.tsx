import { useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadAiSettings, saveAiSettings, type IAiSettings } from '@/lib/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<IAiSettings>(loadAiSettings);

  const patch = (part: Partial<IAiSettings>) => setSettings((prev) => ({ ...prev, ...part }));

  const save = () => {
    saveAiSettings({
      baseUrl: settings.baseUrl.trim(),
      apiKey: settings.apiKey.trim(),
      model: settings.model.trim(),
    });
    toast.success('已保存识别设置');
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
            placeholder="https://open.bigmodel.cn/api/paas/v4/chat/completions"
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
              placeholder="glm-4v-flash"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={save}>
            <Save className="size-4" strokeWidth={1.75} />
            保存
          </Button>
        </div>
      </Card>

      <Card className="rounded-sm p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">怎么填</div>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-foreground">
          <li>默认接口是智谱开放平台的 OpenAI 兼容地址，模型用 glm-4v-flash（视觉识别，免费额度够用）。</li>
          <li>需要装的是「看图回答问题」那一类模型，普通文本模型认不出题目。</li>
          <li>换别家服务商时，接口地址要填到完整的 chat/completions 路径，返回格式必须是 OpenAI 兼容的。</li>
          <li>如果提示跨域被拦截，说明这家服务的接口不允许浏览器直连，换一家或者手动录入。</li>
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
