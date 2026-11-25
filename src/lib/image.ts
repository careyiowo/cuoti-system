/**
 * EXPORTS:
 * compressImage(dataUrl, maxEdge?, quality?) -> Promise<string>
 */

/**
 * 把拍照原图压到长边 maxEdge，输出 JPEG。
 * 目的有三个：减少识别接口的 token 消耗、避免请求体过大被拒、节省本地存储。
 * 1600 长边对题目文字识别足够清晰，再大只是白烧 token。
 */
export async function compressImage(
  dataUrl: string,
  maxEdge = 1600,
  quality = 0.85,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('图片解码失败'));
    el.src = dataUrl;
  });

  const { naturalWidth: width, naturalHeight: height } = img;
  if (!width || !height) return dataUrl;

  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const nextWidth = Math.round(width * scale);
  const nextHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = nextWidth;
  canvas.height = nextHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, nextWidth, nextHeight);
  ctx.drawImage(img, 0, 0, nextWidth, nextHeight);

  const output = canvas.toDataURL('image/jpeg', quality);
  return output.length < dataUrl.length ? output : dataUrl;
}
