import { Plus, X } from 'lucide-react';
import { QUESTION_TYPE_META, SUBJECTS, chaptersOf } from '@/data/taxonomy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { IQuestionDraft } from '@/lib/draft';

interface QuestionEditorProps {
  draft: IQuestionDraft;
  onChange: (next: IQuestionDraft) => void;
}

const COLUMN_WIDTHS = ['w-10', 'w-10', 'w-10', 'w-10'];

export default function QuestionEditor({ draft, onChange }: QuestionEditorProps) {
  const chapters = chaptersOf(draft.subject);

  const patch = (part: Partial<IQuestionDraft>) => onChange({ ...draft, ...part });

  const changeSubject = (subject: string) => {
    const nextChapters = chaptersOf(subject);
    onChange({ ...draft, subject, chapterId: nextChapters[0]?.id ?? draft.chapterId });
  };

  const changeOption = (index: number, text: string) => {
    patch({ options: draft.options.map((o, i) => (i === index ? { ...o, text } : o)) });
  };

  const addOption = () => {
    const label = String.fromCharCode(65 + draft.options.length);
    patch({ options: [...draft.options, { label, text: '' }] });
  };

  const removeOption = (index: number) => {
    patch({
      options: draft.options
        .filter((_, i) => i !== index)
        .map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) })),
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">科目</Label>
          <Select value={draft.subject} onValueChange={changeSubject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">章节</Label>
          <Select value={draft.chapterId} onValueChange={(chapterId) => patch({ chapterId })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">题型</Label>
          <div className="flex gap-1">
            {QUESTION_TYPE_META.map((t) => (
              <Button
                key={t.key}
                type="button"
                size="sm"
                variant={draft.type === t.key ? 'default' : 'outline'}
                onClick={() => patch({ type: t.key })}
                className="flex-1"
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground">题干</Label>
        <Textarea
          value={draft.stem}
          onChange={(e) => patch({ stem: e.target.value })}
          placeholder="题目原文，公式用纯文本写法即可"
          rows={4}
        />
      </div>

      {draft.type === 'choice' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[12px] text-muted-foreground">选项</Label>
            <Button type="button" variant="ghost" size="sm" onClick={addOption}>
              <Plus className="size-3.5" />
              加一项
            </Button>
          </div>
          <div className="space-y-2">
            {draft.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid h-8 shrink-0 place-items-center rounded-sm border border-border bg-muted text-[12px] font-medium',
                    COLUMN_WIDTHS[index] ?? 'w-10',
                  )}
                >
                  {option.label}
                </span>
                <Input
                  value={option.text}
                  onChange={(e) => changeOption(index, e.target.value)}
                  placeholder={`选项 ${option.label} 的内容`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                  aria-label={`删除选项 ${option.label}`}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">
            标准答案（选择题写字母，填空题多个答案用分号分隔）
          </Label>
          <Input
            value={draft.answer}
            onChange={(e) => patch({ answer: e.target.value })}
            placeholder="如 B，或 2;1/2"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">备注（可选）</Label>
          <Input
            value={draft.note}
            onChange={(e) => patch({ note: e.target.value })}
            placeholder="错因、易错点"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground">解析</Label>
        <Textarea
          value={draft.solution}
          onChange={(e) => patch({ solution: e.target.value })}
          placeholder="完整解题步骤，练习提交后展示"
          rows={5}
        />
      </div>
    </div>
  );
}
