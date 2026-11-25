import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus, PencilRuler, Search } from 'lucide-react';
import { listQuestions } from '@/lib/db';
import { QUESTION_TYPE_META, SUBJECTS, chapterById, subjectByKey } from '@/data/taxonomy';
import { MASTERY_META, masteryOf, summarize, typeName } from '@/lib/question';
import type { IQuestion, Mastery } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MasteryMark from '@/components/MasteryMark';
import { cn } from '@/lib/utils';

const MASTERY_ORDER: Mastery[] = ['new', 'reviewing', 'mastered', 'stuck'];

export default function BankPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<string>('all');
  const [chapter, setChapter] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [mastery, setMastery] = useState<string>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let alive = true;
    listQuestions().then((list) => {
      if (!alive) return;
      setQuestions(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const stats = summarize(questions);
  const chapterOptions = subject === 'all' ? [] : (subjectByKey(subject)?.chapters ?? []);

  const visible = questions.filter((q) => {
    if (subject !== 'all' && q.subject !== subject) return false;
    if (chapter !== 'all' && q.chapterId !== chapter) return false;
    if (type !== 'all' && q.type !== type) return false;
    if (mastery !== 'all' && masteryOf(q) !== mastery) return false;
    if (keyword.trim()) {
      const word = keyword.trim();
      if (!q.stem.includes(word) && !q.note.includes(word) && !q.answer.includes(word)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-serif text-2xl tracking-tight text-foreground">错题题库</h1>
          <p className="text-[13px] text-muted-foreground">
            拍下来的每一道错题，按科目与章节归位，重做对了才划掉
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/upload')}>
            <CirclePlus className="size-4" strokeWidth={1.75} />
            收集错题
          </Button>
          <Button onClick={() => navigate('/practice')}>
            <PencilRuler className="size-4" strokeWidth={1.75} />
            开始练习
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 divide-y divide-border rounded-sm border border-border bg-card sm:grid-cols-5 sm:divide-y-0 sm:divide-x">
        <div className="px-4 py-3">
          <div className="font-serif text-xl tabular-nums">{stats.total}</div>
          <div className="text-[11px] text-muted-foreground">错题总数</div>
        </div>
        {MASTERY_ORDER.map((m) => (
          <div key={m} className="px-4 py-3">
            <div className="font-serif text-xl tabular-nums">{stats.counts[m]}</div>
            <div className="text-[11px] text-muted-foreground">{MASTERY_META[m].label}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={subject === 'all'} onClick={() => { setSubject('all'); setChapter('all'); }}>
            全部科目
          </FilterChip>
          {SUBJECTS.map((s) => (
            <FilterChip
              key={s.key}
              active={subject === s.key}
              onClick={() => { setSubject(s.key); setChapter('all'); }}
            >
              {s.short}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜题干、答案或备注"
              className="pl-8"
            />
          </div>
          <Select
            value={chapter}
            onValueChange={setChapter}
            disabled={subject === 'all'}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder={subject === 'all' ? '先选科目' : '全部章节'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部章节</SelectItem>
              {chapterOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部题型</SelectItem>
              {QUESTION_TYPE_META.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={mastery} onValueChange={setMastery}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {MASTERY_ORDER.map((m) => (
                <SelectItem key={m} value={m}>
                  {MASTERY_META[m].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {loading ? (
        <p className="py-16 text-center text-[13px] text-muted-foreground">正在读取题库</p>
      ) : questions.length === 0 ? (
        <Card className="border-dashed px-6 py-16 text-center">
          <p className="font-serif text-lg text-foreground">题库还是空的</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
            把做错的题拍下来，连答案和解析一起拍，系统会识别成结构化的错题
          </p>
          <Button className="mt-5" onClick={() => navigate('/upload')}>
            去收集第一道题
          </Button>
        </Card>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-[13px] text-muted-foreground">这个筛选条件下没有题</p>
      ) : (
        <div className="space-y-2">
          {visible.map((q, index) => {
            const m = masteryOf(q);
            return (
              <Link key={q.id} to={`/question/${q.id}`} className="block">
                <Card className="rounded-sm transition-colors hover:border-primary/50">
                  <div className="flex gap-3 p-3.5">
                    <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border pr-3">
                      <span className="font-serif text-base leading-none tabular-nums text-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <MasteryMark mastery={m} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {subjectByKey(q.subject)?.short ?? q.subject}
                        </span>
                        <span>{chapterById(q.chapterId)?.name ?? '未分类章节'}</span>
                        <span>·</span>
                        <span>{typeName(q.type)}</span>
                        <span className="ml-auto tabular-nums">
                          重做 {q.attempts} 次 · 对 {q.correct} 错 {q.wrong}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[13px] leading-relaxed text-foreground">
                        {q.stem || '（无题干文字，查看图片）'}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sm border px-2.5 py-1 text-[12px] transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/** 让题型 union 在筛选时保持可读 */
