import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Home, PencilRuler, X } from 'lucide-react';
import { toast } from 'sonner';
import MasteryMark from '@/components/MasteryMark';
import MathText from '@/components/MathText';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { chapterById, subjectByKey } from '@/data/taxonomy';
import { getQuestion, getSession, saveQuestion, saveSession } from '@/lib/db';
import { applyAttempt, masteryOf, typeName } from '@/lib/question';
import type { IQuestion, ISession } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PracticeResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ISession | null>(null);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!sessionId) return;
    getSession(sessionId).then(async (hit) => {
      if (!alive || !hit) return;
      setSession(hit);
      const loaded: IQuestion[] = [];
      for (const qid of hit.questionIds) {
        const one = await getQuestion(qid);
        if (one) loaded.push(one);
      }
      if (alive) setQuestions(loaded);
    });
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const selfGrade = async (q: IQuestion, correct: boolean) => {
    if (!session) return;
    setGrading(true);
    try {
      const updated = applyAttempt(q, correct, session.responses[q.id]?.answer ?? '');
      await saveQuestion(updated);
      const previous = session.responses[q.id] ?? { answer: '', correct: null };
      const next: ISession = {
        ...session,
        responses: { ...session.responses, [q.id]: { ...previous, correct } },
      };
      await saveSession(next);
      setSession(next);
      setQuestions((prev) => prev.map((item) => (item.id === q.id ? updated : item)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setGrading(false);
    }
  };

  if (!session) {
    return <p className="py-16 text-center text-[13px] text-muted-foreground">正在统计结果</p>;
  }

  const graded = questions.filter((q) => session.responses[q.id]?.correct !== null && session.responses[q.id]?.correct !== undefined);
  const correctCount = graded.filter((q) => session.responses[q.id]?.correct === true).length;
  const pending = questions.length - graded.length;
  const rate = graded.length > 0 ? Math.round((correctCount / graded.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {session.scopeLabel}
        </div>
        <h1 className="font-serif text-2xl tracking-tight text-foreground">作答结果</h1>
      </header>

      <section className="grid grid-cols-2 divide-y divide-border rounded-sm border border-border bg-card sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
        <div className="px-4 py-3">
          <div className="font-serif text-2xl tabular-nums text-foreground">
            {correctCount}
            <span className="text-base text-muted-foreground"> / {graded.length}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">客观题做对</div>
        </div>
        <div className="px-4 py-3">
          <div className="font-serif text-2xl tabular-nums text-foreground">{rate}%</div>
          <div className="text-[11px] text-muted-foreground">正确率</div>
        </div>
        <div className="px-4 py-3">
          <div className="font-serif text-2xl tabular-nums text-foreground">{pending}</div>
          <div className="text-[11px] text-muted-foreground">待你自评</div>
        </div>
        <div className="px-4 py-3">
          <div className="font-serif text-2xl tabular-nums text-foreground">{questions.length}</div>
          <div className="text-[11px] text-muted-foreground">本组题量</div>
        </div>
      </section>

      {pending > 0 && (
        <p className="rounded-sm border border-warning/40 bg-warning/8 px-3 py-2 text-[12px] text-foreground">
          还有 {pending} 道大题没有判定结果，对照下面的解析给自己打个分，系统会据此更新掌握状态
        </p>
      )}

      <div className="space-y-3">
        {questions.map((q, index) => {
          const response = session.responses[q.id];
          const correct = response?.correct ?? null;
          return (
            <Card key={q.id} className="rounded-sm p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
                <span className="font-serif text-base tabular-nums text-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-medium text-foreground">{subjectByKey(q.subject)?.short}</span>
                <span>{chapterById(q.chapterId)?.name}</span>
                <span>·</span>
                <span>{typeName(q.type)}</span>
                <span
                  className={cn(
                    'ml-auto rounded-sm border px-1.5 py-0.5 text-[11px]',
                    correct === true && 'border-success/50 bg-success/10 text-success',
                    correct === false && 'border-destructive/50 bg-destructive/10 text-destructive',
                    correct === null && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {correct === true ? '做对' : correct === false ? '做错' : '待自评'}
                </span>
                <MasteryMark mastery={masteryOf(q)} withLabel />
              </div>

              {q.stem ? (
                <MathText text={q.stem} className="mt-2 text-[13px] leading-7 text-foreground" />
              ) : (
                <p className="mt-2 text-[13px] text-muted-foreground">（这道题只有图片）</p>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-sm border border-border px-3 py-2">
                  <div className="text-[11px] text-muted-foreground">你的答案</div>
                  {response?.answer?.trim() ? (
                    <MathText text={response.answer} className="mt-0.5 text-[13px] leading-7 text-foreground" />
                  ) : (
                    <p className="mt-0.5 text-[13px] text-muted-foreground">（未作答）</p>
                  )}
                </div>
                <div className="rounded-sm border border-border px-3 py-2">
                  <div className="text-[11px] text-muted-foreground">标准答案</div>
                  {q.answer ? (
                    <MathText text={q.answer} className="mt-0.5 text-[13px] leading-7 text-foreground" />
                  ) : (
                    <p className="mt-0.5 text-[13px] text-muted-foreground">未录入</p>
                  )}
                </div>
              </div>

              {correct === true && q.wrongAnswer && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  上次你的答案是 <span className="text-destructive">{q.wrongAnswer}</span>，这回改对了
                </p>
              )}

              {(correct === false || correct === null) && (
                <div className="mt-3 rounded-sm bg-muted/70 px-3 py-2.5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">解析</div>
                  {q.solution ? (
                    <MathText
                      text={q.solution}
                      className="mt-1.5 border-l-2 border-primary/25 pl-3 text-[13px] leading-8 text-foreground"
                    />
                  ) : (
                    <p className="mt-1 text-[13px] text-muted-foreground">这道题还没录入解析</p>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {correct === null ? (
                  <>
                    <Button size="sm" disabled={grading} onClick={() => void selfGrade(q, true)}>
                      <Check className="size-3.5" strokeWidth={2} />
                      我答对了
                    </Button>
                    <Button size="sm" variant="outline" disabled={grading} onClick={() => void selfGrade(q, false)}>
                      <X className="size-3.5" strokeWidth={2} />
                      我答错了
                    </Button>
                  </>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {correct ? '这道题又对了一次，连对次数已累加' : '已记入错题，下次组卷可以优先排它'}
                  </span>
                )}
                <Link
                  to={`/question/${q.id}`}
                  className="ml-auto text-[12px] text-primary underline-offset-4 hover:underline"
                >
                  查看原题
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home className="size-4" strokeWidth={1.75} />
          回到题库
        </Button>
        <Button onClick={() => navigate('/practice')}>
          <PencilRuler className="size-4" strokeWidth={1.75} />
          再练一组
        </Button>
      </div>
    </div>
  );
}
