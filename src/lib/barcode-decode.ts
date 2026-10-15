import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

import { isValidIsbn, normaliseIsbn } from "@/lib/book-lookup";

/** Phone photos are often far larger than the barcode needs. */
const SIZES = [2000, 1000] as const;
export const ROTATIONS = [0, 90, 270] as const;
export type Rotation = (typeof ROTATIONS)[number];
const CONTRAST = 1.8;

export function barcodeHints() {
  const hints = new Map();
  // ISBN barcodes first, then the other common book-label formats.
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.UPC_A,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.ITF,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.PURE_BARCODE, false);
  return hints;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not open the photo."));
    img.src = url;
  });
}

/** Stretches contrast around the average brightness, so faint bars stand out. */
function boostContrast(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  const luminance = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    luminance[j] = l;
    sum += l;
  }
  const mean = sum / (width * height);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const v = (luminance[j] - mean) * CONTRAST + mean;
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
}

/**
 * Draws one version of an image (rotated, resized to at most `maxSide`, and
 * optionally contrast-boosted) onto `canvas`. Works for photos and video frames.
 */
export function drawVariant(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  rotation: Rotation,
  maxSide: number,
  boost: boolean,
): void {
  const longest = Math.max(sourceWidth, sourceHeight);
  const scale = Math.min(1, maxSide / longest);
  const w = Math.round(sourceWidth * scale);
  const h = Math.round(sourceHeight * scale);
  const swapped = rotation === 90 || rotation === 270;

  canvas.width = swapped ? h : w;
  canvas.height = swapped ? w : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot read the image.");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(source, -w / 2, -h / 2, w, h);
  if (boost) boostContrast(ctx, canvas.width, canvas.height);
}

/** Draws one version of the photo to a temporary image URL. */
function renderVariant(
  img: HTMLImageElement,
  rotation: Rotation,
  maxSide: number,
  boost: boolean,
): Promise<string> {
  const canvas = document.createElement("canvas");
  drawVariant(canvas, img, img.naturalWidth, img.naturalHeight, rotation, maxSide, boost);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error("Could not prepare the photo."));
    }, "image/png");
  });
}

/**
 * Reads the barcode from a photo. Tries the photo as taken, then rotated and
 * higher-contrast versions, and stops at the first valid ISBN. Returns the
 * first barcode text it saw if none is a valid ISBN, or null if nothing reads.
 */
export async function decodeIsbnBarcode(file: File): Promise<string | null> {
  const fileUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(fileUrl);
    const reader = new BrowserMultiFormatReader(barcodeHints());
    let firstRead: string | null = null;

    for (const rotation of ROTATIONS) {
      for (const size of SIZES) {
        for (const boost of [false, true]) {
          const variantUrl = await renderVariant(img, rotation, size, boost);
          try {
            const result = await reader.decodeFromImageUrl(variantUrl);
            const text = normaliseIsbn(result.getText());
            if (isValidIsbn(text)) return text;
            firstRead ??= text;
          } catch {
            // Nothing readable in this version; try the next one.
          } finally {
            URL.revokeObjectURL(variantUrl);
          }
        }
      }
    }
    return firstRead;
  } finally {
    URL.revokeObjectURL(fileUrl);
  }
}
