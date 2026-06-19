/**
 * Клиентское сжатие фото через <canvas> → image/webp в двух размерах.
 *   full  — до 1600px по длинной стороне (страница объекта)
 *   thumb — до 480px (карточка в листинге)
 * Возвращаем оба Blob'а + object-URL для превью.
 *
 * Никаких внешних зависимостей: createImageBitmap + OffscreenCanvas с
 * фолбэком на обычный canvas там, где Offscreen не поддерживается.
 */
export interface CompressedPhoto {
  full: Blob;
  thumb: Blob;
  previewUrl: string;
}

const FULL_MAX = 1600;
const THUMB_MAX = 480;
const QUALITY = 0.82;

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const bitmap = await createImageBitmap(file);
  const full = await encode(bitmap, FULL_MAX);
  const thumb = await encode(bitmap, THUMB_MAX);
  bitmap.close?.();
  return { full, thumb, previewUrl: URL.createObjectURL(full) };
}

async function encode(src: ImageBitmap, maxSide: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
  const w = Math.round(src.width * scale);
  const h = Math.round(src.height * scale);

  if (typeof OffscreenCanvas !== "undefined") {
    const c = new OffscreenCanvas(w, h);
    c.getContext("2d")!.drawImage(src, 0, 0, w, h);
    return await c.convertToBlob({ type: "image/webp", quality: QUALITY });
  }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(src, 0, 0, w, h);
  return await new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/webp", QUALITY),
  );
}
