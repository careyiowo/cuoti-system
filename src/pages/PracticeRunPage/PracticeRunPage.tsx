import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import AnswerSheet from '@/components/AnswerSheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { chapterById, subjectByKey } from '@/data/taxonomy';
import { getQuestion, getSession, saveQuestion, saveSession } from '@/lib/db';
import { applyAttempt, checkAnswer, typeName } from '@/lib/question';
import type { IQuestion, IResponse, ISession } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PracticeRunPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ISession | null>(null);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (session?.finishedAt) {
      navigate(`/practice/result/${session.id}`, { replace: true });
    }
  }, [session, navigate]);

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submit = async () => {
    if (!session || questions.length === 0) return;
    setSubmitting(true);
    try {
      const responses: Record<string, IResponse> = {};
      for (const q of questions) {
        const text = answers[q.id] ?? '';
        const correct = checkAnswer(q, text);
        responses[q.id] = { answer: text, correct };
        if (correct !== null) {
          await saveQuestion(applyAttempt(q, correct));
        }
      }
      await saveSession({ ...session, finishedAt: Date.now(), responses });
      navigate(`/practice/result/${session.id}`, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    const blank = questions.filter((q) => !(answers[q.id] ?? '').trim()).length;
    if (blank > 0) {
      setConfirmOpen(true);
      return;
    }
    void submit();
  };

  const question = questions[index];
  const answeredCount = questions.filter((q) => (answers[q.id] ?? '').trim()).length;

  if (!question) {
    return <p className="py-16 text-center text-[13px] text-muted-foreground">正在生成答题卡</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {session?.scopeLabel ?? '练习'}
          </div>
          <div className="text-[13px] text-foreground">
            第 <span className="font-serif text-lg tabular-nums">{index + 1}</span> / {questions.length} 题
            <span className="ml-3 text-muted-foreground">
              已作答 {answeredCount} 题
            </span>
          </div>
        </div>
        <Button onClick={handleSubmitClick} disabled={submitting}>
          {submitting ? '判分中' : '交卷'}
        </Button>
      </div>

      <Card className="rounded-sm p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
          <span className="font-serif text-base tabular-nums text-foreground">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-medium text-foreground">{subjectByKey(question.subject)?.short}</span>
          <span>{chapterById(question.chapterId)?.name}</span>
          <span>·</span>
          <span>{typeName(question.type)}</span>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-[14px] leading-7 text-foreground">
          {question.stem || '（这道题只有图片，请在纸上作答）'}
        </p>

        {question.type === 'choice' && (
          <div className="mt-4 space-y-1.5">
            {question.options.map((option) => {
              const active = (answers[question.id] ?? '') === option.label;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setAnswer(question.id, option.label)}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-sm border px-3 py-2 text-left text-[13px] transition-colors',
                    active
                      ? 'border-primary bg-primary/8 text-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/50',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[11px]',
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="leading-6">{option.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'blank' && (
          <div className="mt-4">
            <Input
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="把答案填在这里"
              className="max-w-md"
            />
          </div>
        )}

        {question.type === 'essay' && (
          <div className="mt-4 space-y-2">
            <p className="text-[12px] text-muted-foreground">
              大题在纸上写完整过程，交卷后会给出解析，再由你自己判断对错
            </p>
            <Textarea
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="可以在这里记一下思路要点（可留空）"
              rows={4}
            />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="size-4" />
          上一题
        </Button>
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          disabled={index === questions.length - 1}
        >
          下一题
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Card className="rounded-sm p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">答题卡</span>
          <span className="text-[11px] text-muted-foreground">点题号可以直接跳过去</span>
        </div>
        <AnswerSheet
          current={index}
          entries={questions.map((q) => ({ answered: (answers[q.id] ?? '').trim().length > 0 }))}
          onJump={setIndex}
        />
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>还有题没作答</AlertDialogTitle>
            <AlertDialogDescription>
              有 {questions.filter((q) => !(answers[q.id] ?? '').trim()).length} 道题是空的，空题按答错计。确定交卷吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续作答</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void submit();
              }}
            >
              交卷
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
