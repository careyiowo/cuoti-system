import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, ImagePlus, Info, Loader2, Settings2, Sparkles, Trash2 } from 'lucide-react';
import QuestionEditor from '@/components/QuestionEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { emptyDraft, questionFromDraft, type IQuestionDraft } from '@/lib/draft';
import { recognizeQuestion, solveQuestion } from '@/lib/ai';
import { loadAiSettings } from '@/lib/settings';
import { compressImage } from '@/lib/image';
import { saveImage, saveQuestion } from '@/lib/db';

interface IImageDraft {
  key: string;
  dataUrl: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const navigate = useNavigate();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const [images, setImages] = useState<IImageDraft[]>([]);
  const [draft, setDraft] = useState<IQuestionDraft>(emptyDraft);
  const [mode, setMode] = useState<'capture' | 'edit'>('capture');
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [solving, setSolving] = useState(false);
  /** 答案与解析是不是 AI 解出来的，保存时据此打来源标记 */
  const [aiSolved, setAiSolved] = useState(false);

  const handlePick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setReading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (file) => compressImage(await readAsDataUrl(file))),
      );
      setImages((prev) => [
        ...prev,
        ...urls.map((dataUrl) => ({ key: `img-${seq.current++}`, dataUrl })),
      ]);
    } catch {
      toast.error('有图片没读出来，换一张试试');
    } finally {
      setReading(false);
    }
  };

  const removeImage = (key: string) => {
    setImages((prev) => prev.filter((item) => item.key !== key));
  };

  const handleRecognize = async () => {
    if (images.length === 0) {
      toast.error('先加题目图片');
      return;
    }
    setBusy(true);
    try {
      const settings = loadAiSettings();
      const result = await recognizeQuestion(images.map((i) => i.dataUrl), settings);
      const nextDraft: IQuestionDraft = {
        subject: result.subject,
        chapterId: result.chapterId,
        type: result.type,
        stem: result.stem,
        options:
          result.options.length > 0
            ? result.options
            : ['A', 'B', 'C', 'D'].map((label) => ({ label, text: '' })),
        answer: result.answer,
        solution: result.solution,
        note: '',
      };
      setDraft(nextDraft);
      setMode('edit');

      if (!result.answer.trim() && result.stem.trim()) {
        // 只拍到了题干：答案和解析交给文本模型解，能省掉拍答案那一页
        setSolving(true);
        try {
          const solved = await solveQuestion(
            {
              subject: nextDraft.subject,
              type: nextDraft.type,
              stem: nextDraft.stem,
              options: nextDraft.options,
            },
            settings,
          );
          setDraft({ ...nextDraft, answer: solved.answer, solution: solved.solution });
          setAiSolved(true);
          toast.success('没拍到答案，AI 已经解了一遍；存之前务必对着教材核一遍');
        } catch (error) {
          toast.error(
            `没拍到答案，AI 也没解出来：${error instanceof Error ? error.message : String(error)}`,
          );
        } finally {
          setSolving(false);
        }
      } else {
        setAiSolved(false);
        toast.success('识别完成，核对一遍再保存');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  /** 改了题干或对 AI 结果不放心时，重解一遍覆盖答案与解析 */
  const handleSolve = async () => {
    if (!draft.stem.trim()) {
      toast.error('要先有题干文字才能解');
      return;
    }
    setSolving(true);
    try {
      const settings = loadAiSettings();
      const solved = await solveQuestion(
        { subject: draft.subject, type: draft.type, stem: draft.stem, options: draft.options },
        settings,
      );
      setDraft((prev) => ({ ...prev, answer: solved.answer, solution: solved.solution }));
      setAiSolved(true);
      toast.success('已重新求解，答案和解析被覆盖');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSolving(false);
    }
  };

  const handleSave = async () => {
    if (!draft.stem.trim() && images.length === 0) {
      toast.error('题干和图片至少要有一个');
      return;
    }
    if (draft.type === 'choice' && draft.options.every((o) => !o.text.trim())) {
      toast.error('选择题至少要填一个选项');
      return;
    }
    setBusy(true);
    try {
      const imageIds: string[] = [];
      for (const item of images) {
        imageIds.push(await saveImage(item.dataUrl));
      }
      const created = questionFromDraft(draft);
      await saveQuestion({
        ...created,
        imageIds,
        solutionSource: aiSolved ? 'ai' : 'manual',
      });
      toast.success('已存入题库');
      navigate(`/question/${created.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-2xl tracking-tight text-foreground">收集错题</h1>
        <p className="text-[13px] text-muted-foreground">
          拍一张题干就够：题干、章节、题型自动识别；没拍到答案时，答案和解析交给模型先解出来，你再核对
        </p>
      </header>

      {mode === 'capture' ? (
        <>
          <Card className="rounded-sm">
            <div className="p-4">
              <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-border px-4 py-10">
                <p className="text-[13px] text-muted-foreground">
                  {reading ? '正在读取图片' : '拍题干那一页就行，答案页拍了更好'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" onClick={() => cameraRef.current?.click()}>
                    <Camera className="size-4" strokeWidth={1.75} />
                    拍照
                  </Button>
                  <Button type="button" variant="outline" onClick={() => galleryRef.current?.click()}>
                    <ImagePlus className="size-4" strokeWidth={1.75} />
                    从相册选
                  </Button>
                </div>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    void handlePick(e.target.files);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handlePick(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {images.map((item) => (
                    <div key={item.key} className="group relative overflow-hidden rounded-sm border border-border">
                      <Image src={item.dataUrl} alt="待识别的错题图片" className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(item.key)}
                        className="absolute right-1 top-1 grid size-6 place-items-center rounded-sm bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="移除这张图片"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleRecognize} disabled={busy || images.length === 0}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" strokeWidth={1.75} />}
              {busy ? '识别中' : '识别并填入'}
            </Button>
            <Button variant="outline" onClick={() => setMode('edit')} disabled={busy}>
              手动填写
            </Button>
            <span className="text-[12px] text-muted-foreground">
              识别需要 API Key，没配也可以手动录入
            </span>
            <Link to="/settings" className="text-[12px] text-primary underline-offset-4 hover:underline">
              <Settings2 className="mr-1 inline size-3.5 align-[-2px]" />
              去设置
            </Link>
          </div>
        </>
      ) : (
        <>
          {aiSolved && (
            <div className="flex items-start gap-2 rounded-sm border border-border bg-muted px-3 py-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <p className="text-[12px] leading-5 text-foreground">
                答案和解析是 AI 解出来的，没核对过教材。选择题的答案会直接用来判分，错一个字母分数就全歪，存之前先看一眼。
              </p>
            </div>
          )}

          <Card className="rounded-sm p-4">
            <QuestionEditor draft={draft} onChange={setDraft} />
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={busy || solving}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              存入题库
            </Button>
            <Button variant="outline" onClick={handleSolve} disabled={busy || solving}>
              {solving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" strokeWidth={1.75} />
              )}
              {solving ? '解题中' : '让 AI 重新解一遍'}
            </Button>
            <Button variant="outline" onClick={() => setMode('capture')} disabled={busy || solving}>
              返回图片
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
