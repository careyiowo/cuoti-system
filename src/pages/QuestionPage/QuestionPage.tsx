import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, Pencil, Sparkles, Trash2, X } from 'lucide-react';
import MasteryMark from '@/components/MasteryMark';
import QuestionEditor from '@/components/QuestionEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { chapterById, subjectByKey } from '@/data/taxonomy';
import { deleteQuestion, getImages, getQuestion, saveQuestion } from '@/lib/db';
import { draftFromQuestion, questionFromDraft, type IQuestionDraft } from '@/lib/draft';
import { solveQuestion } from '@/lib/ai';
import { loadAiSettings } from '@/lib/settings';
import { masteryOf, typeName } from '@/lib/question';
import type { IImageRecord, IQuestion } from '@/lib/types';

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [images, setImages] = useState<IImageRecord[]>([]);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<IQuestionDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!id) return;
    getQuestion(id).then(async (hit) => {
      if (!alive) return;
      if (!hit) {
        setMissing(true);
        return;
      }
      setQuestion(hit);
      const pics = await getImages(hit.imageIds);
      if (alive) setImages(pics);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const markMastered = async () => {
    if (!question) return;
    const now = Date.now();
    const next: IQuestion = { ...question, streak: 2, lastResult: 'correct', updatedAt: now };
    await saveQuestion(next);
    setQuestion(next);
    toast.success('已标记为已掌握');
  };

  const markWrong = async () => {
    if (!question) return;
    const now = Date.now();
    const next: IQuestion = {
      ...question,
      attempts: question.attempts + 1,
      wrong: question.wrong + 1,
      streak: 0,
      lastResult: 'wrong',
      lastPracticedAt: now,
      updatedAt: now,
    };
    await saveQuestion(next);
    setQuestion(next);
    toast.success('已标记为做错，重做次数 +1');
  };

  const openEdit = () => {
    if (!question) return;
    setDraft(draftFromQuestion(question));
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!question || !draft) return;
    const next = questionFromDraft(draft, question);
    await saveQuestion(next);
    setQuestion(next);
    setEditing(false);
    toast.success('已保存修改');
  };

  const removeQuestion = async () => {
    if (!question) return;
    await deleteQuestion(question.id);
    toast.success('已删除这道错题');
    navigate('/');
  };

  const resolveWithAi = async () => {
    if (!question) return;
    if (!question.stem.trim()) {
      toast.error('这道题没有题干文字，AI 解不了，先编辑补上题干');
      return;
    }
    setSolving(true);
    try {
      const settings = loadAiSettings();
      const solved = await solveQuestion(
        {
          subject: question.subject,
          type: question.type,
          stem: question.stem,
          options: question.options,
        },
        settings,
      );
      const next: IQuestion = {
        ...question,
        answer: solved.answer,
        solution: solved.solution,
        solutionSource: 'ai',
        updatedAt: Date.now(),
      };
      await saveQuestion(next);
      setQuestion(next);
      toast.success('已用 AI 重解，答案和解析被覆盖，记得核对');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSolving(false);
    }
  };

  if (missing) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-[13px] text-muted-foreground">这道题不在题库里，可能已经被删掉了</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          回到题库
        </Button>
      </div>
    );
  }

  if (!question) {
    return <p className="py-16 text-center text-[13px] text-muted-foreground">正在读取</p>;
  }

  const mastery = masteryOf(question);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          题库
        </Link>
        <span className="text-[12px] text-muted-foreground">/</span>
        <span className="text-[12px] text-foreground">
          {subjectByKey(question.subject)?.short ?? question.subject}
        </span>
        <span className="text-[12px] text-muted-foreground">{chapterById(question.chapterId)?.name}</span>
        <span className="text-[12px] text-muted-foreground">· {typeName(question.type)}</span>
        <MasteryMark mastery={mastery} withLabel className="ml-auto" />
      </div>

      <Card className="rounded-sm p-5">
        <p className="whitespace-pre-wrap text-[14px] leading-7 text-foreground">
          {question.stem || '（这道题只有图片，没有文字题干）'}
        </p>

        {question.options.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {question.options.map((option) => (
              <div key={option.label} className="flex gap-2 text-[13px] leading-6">
                <span className="w-5 shrink-0 font-medium text-muted-foreground">{option.label}</span>
                <span className="text-foreground">{option.text}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((pic) => (
            <div key={pic.id} className="overflow-hidden rounded-sm border border-border bg-card">
              <Image src={pic.dataUrl} alt="错题原图" className="w-full object-contain" />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-sm p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">标准答案</div>
            {question.solutionSource === 'ai' && (
              <span className="text-[11px] text-muted-foreground">AI 求解 · 未核对</span>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-[14px] text-foreground">
            {question.answer || '未录入'}
          </p>
        </Card>
        <Card className="rounded-sm p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">作答记录</div>
          <p className="mt-1.5 text-[13px] text-foreground">
            重做 {question.attempts} 次 · 对 {question.correct} · 错 {question.wrong} · 连续对 {question.streak}
          </p>
          {question.note && <p className="mt-1 text-[12px] text-muted-foreground">备注：{question.note}</p>}
        </Card>
      </div>

      <Card className="rounded-sm p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">解析</div>
        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-7 text-foreground">
          {question.solution || '未录入解析'}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button onClick={markMastered}>
          <Check className="size-4" strokeWidth={2} />
          标记已掌握
        </Button>
        <Button variant="outline" onClick={markWrong}>
          <X className="size-4" strokeWidth={2} />
          标记仍做错
        </Button>
        <Button variant="outline" onClick={openEdit}>
          <Pencil className="size-4" strokeWidth={1.75} />
          编辑
        </Button>
        <Button variant="outline" onClick={resolveWithAi} disabled={solving}>
          {solving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" strokeWidth={1.75} />
          )}
          {solving ? '解题中' : '让 AI 重解'}
        </Button>
        <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" strokeWidth={1.75} />
          删除
        </Button>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif">编辑这道错题</DialogTitle>
          </DialogHeader>
          {draft && <QuestionEditor draft={draft} onChange={setDraft} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              取消
            </Button>
            <Button onClick={saveEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这道错题？</AlertDialogTitle>
            <AlertDialogDescription>图片会一起删掉，不能恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={removeQuestion}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
