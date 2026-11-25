import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { QUESTION_TYPE_META, SUBJECTS, chaptersOf } from '@/data/taxonomy';
import { MASTERY_META, masteryOf } from '@/lib/question';
import { dueList } from '@/lib/review';
import { createSession, shuffle } from '@/lib/session';
import { listQuestions } from '@/lib/db';
import type { IQuestion, Mastery, QuestionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MASTERY_ORDER: Mastery[] = ['new', 'reviewing', 'mastered', 'stuck'];

type OrderMode = 'random' | 'wrong' | 'stale' | 'due';

const ORDER_META: Record<OrderMode, { name: string; hint: string }> = {
  random: { name: '随机抽题', hint: '题库里随便抽' },
  wrong: { name: '优先错得多', hint: '错得越多越靠前' },
  stale: { name: '优先久没做', hint: '离上次重做越久越靠前' },
  due: { name: '只取今日到期', hint: '按复习间隔算今天该做的' },
};

const ORDER_KEYS: OrderMode[] = ['random', 'wrong', 'stale', 'due'];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function PracticeSetupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [masteries, setMasteries] = useState<Mastery[]>([]);
  const [order, setOrder] = useState<OrderMode>(params.get('mode') === 'due' ? 'due' : 'random');
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let alive = true;
    listQuestions().then((list) => {
      if (alive) setQuestions(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const chapterPool = subjects.length > 0
    ? subjects.flatMap((key) => chaptersOf(key))
    : SUBJECTS.flatMap((s) => s.chapters);

  const basePool = questions.filter((q) => {
    if (subjects.length > 0 && !subjects.includes(q.subject)) return false;
    if (chapters.length > 0 && !chapters.includes(q.chapterId)) return false;
    if (types.length > 0 && !types.includes(q.type)) return false;
    if (masteries.length > 0 && !masteries.includes(masteryOf(q))) return false;
    return true;
  });

  const pool = order === 'due' ? dueList(basePool) : basePool;

  const scopeLabel = [
    subjects.length === 0
      ? '全部科目'
      : subjects.map((key) => SUBJECTS.find((s) => s.key === key)?.short ?? key).join('、'),
    chapters.length === 0 ? '全部章节' : `${chapters.length} 个章节`,
    types.length === 0 ? '全部题型' : types.map((t) => QUESTION_TYPE_META.find((m) => m.key === t)?.short).join('、'),
    ORDER_META[order].name,
  ].join(' · ');

  const start = async () => {
    if (pool.length === 0) return;
    setStarting(true);
    const take = Math.max(1, Math.min(count || 1, pool.length));

    let ranked: IQuestion[];
    if (order === 'wrong') {
      ranked = [...pool].sort(
        (a, b) => b.wrong - a.wrong || b.attempts - a.attempts || a.createdAt - b.createdAt,
      );
    } else if (order === 'stale') {
      ranked = [...pool].sort(
        (a, b) => (a.lastPracticedAt ?? 0) - (b.lastPracticedAt ?? 0),
      );
    } else if (order === 'due') {
      ranked = pool;
    } else {
      ranked = shuffle(pool);
    }

    const picked = shuffle(ranked.slice(0, take));
    const session = await createSession(picked, scopeLabel);
    navigate(`/practice/run/${session.id}`);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-2xl tracking-tight text-foreground">开始练习</h1>
        <p className="text-[13px] text-muted-foreground">
          从题库里挑一批题组卷，交卷后选择填空自动判分，大题对照解析自评
        </p>
      </header>

      <Card className="space-y-5 rounded-sm p-5">
        <Section label="选题方式" hint={ORDER_META[order].hint}>
          {ORDER_KEYS.map((key) => (
            <Chip key={key} active={order === key} onClick={() => setOrder(key)}>
              {ORDER_META[key].name}
            </Chip>
          ))}
        </Section>

        <Section label="科目" hint="不选就是全部科目">
          {SUBJECTS.map((s) => (
            <Chip
              key={s.key}
              active={subjects.includes(s.key)}
              onClick={() => setSubjects((prev) => toggleValue(prev, s.key))}
            >
              {s.name}
            </Chip>
          ))}
        </Section>

        <Section label="章节" hint="不选就是全部章节">
          {chapterPool.map((c) => (
            <Chip
              key={c.id}
              active={chapters.includes(c.id)}
              onClick={() => setChapters((prev) => toggleValue(prev, c.id))}
            >
              {c.name}
            </Chip>
          ))}
        </Section>

        <Section label="题型" hint="不选就是全部题型">
          {QUESTION_TYPE_META.map((t) => (
            <Chip
              key={t.key}
              active={types.includes(t.key)}
              onClick={() => setTypes((prev) => toggleValue(prev, t.key))}
            >
              {t.name}
            </Chip>
          ))}
        </Section>

        <Section label="掌握状态" hint="查漏补缺时只勾「反复错」和「重做中」">
          {MASTERY_ORDER.map((m) => (
            <Chip
              key={m}
              active={masteries.includes(m)}
              onClick={() => setMasteries((prev) => toggleValue(prev, m))}
            >
              {MASTERY_META[m].label}
            </Chip>
          ))}
        </Section>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="text-[13px] text-foreground">做几道</div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={1}
              max={pool.length || 1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 0)}
              className="w-24 tabular-nums"
            />
            {[5, 10, 20].map((n) => (
              <Button key={n} type="button" variant="outline" size="sm" onClick={() => setCount(n)}>
                {n} 题
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pool.length === 0}
              onClick={() => setCount(pool.length)}
            >
              全部 {pool.length} 题
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          符合条件 <span className="font-serif text-lg tabular-nums text-foreground">{pool.length}</span> 道，本次抽
          <span className="mx-1 font-serif text-lg tabular-nums text-foreground">
            {Math.min(count || 0, pool.length)}
          </span>
          道
        </p>
        <Button onClick={start} disabled={pool.length === 0 || starting} size="lg">
          生成答题卡
          <ArrowRight className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">题库还是空的，先去收集几道错题再来组卷</p>
      ) : order === 'due' && pool.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">
          今天没有到期的题。复习间隔是按连续做对次数算的：错过的题隔一天就回来，连对越多隔得越久。换个选题方式，或者明天再来。
        </p>
      ) : null}
    </div>
  );
}

interface SectionProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

function Section({ label, hint, children }: SectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
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
