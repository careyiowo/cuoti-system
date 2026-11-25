import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, ImagePlus, Loader2, Settings2, Sparkles, Trash2 } from 'lucide-react';
import QuestionEditor from '@/components/QuestionEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { emptyDraft, questionFromDraft, type IQuestionDraft } from '@/lib/draft';
import { recognizeQuestion } from '@/lib/ai';
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
      setDraft({
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
      });
      setMode('edit');
      toast.success('识别完成，核对一遍再保存');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
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
      await saveQuestion({ ...created, imageIds });
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
          题目和答案一起拍，识别出来是一道完整的错题：题干、科目章节、题型、答案和解析
        </p>
      </header>

      {mode === 'capture' ? (
        <>
          <Card className="rounded-sm">
            <div className="p-4">
              <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-border px-4 py-10">
                <p className="text-[13px] text-muted-foreground">
                  {reading ? '正在读取图片' : '拍题目页，再拍一页答案与解析'}
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
          <Card className="rounded-sm p-4">
            <QuestionEditor draft={draft} onChange={setDraft} />
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              存入题库
            </Button>
            <Button variant="outline" onClick={() => setMode('capture')} disabled={busy}>
              返回图片
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
