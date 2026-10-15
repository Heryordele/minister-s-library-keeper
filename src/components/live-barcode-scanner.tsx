import { useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  MultiFormatReader,
} from "@zxing/library";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { drawVariant, ROTATIONS } from "@/lib/barcode-decode";
import { isValidIsbn, normaliseIsbn } from "@/lib/book-lookup";

/** Printed ISBNs are EAN-13 barcodes, so reading only that format is faster. */
function liveHints() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return hints;
}

/** Each frame is checked at this size, which keeps phones responsive. */
const FRAME_MAX_SIDE = 1280;
/** Time between frame checks. */
const FRAME_INTERVAL_MS = 300;
/** Shown if nothing has been read after this long. */
const TIP_AFTER_MS = 6000;

/** Tries to read an ISBN from the canvas, returning it only if it is valid. */
function readIsbn(reader: MultiFormatReader, canvas: HTMLCanvasElement): string | null {
  try {
    const source = new HTMLCanvasElementLuminanceSource(canvas);
    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(source)));
    const text = normaliseIsbn(result.getText());
    return isValidIsbn(text) ? text : null;
  } catch {
    // No barcode in this version of the frame.
    return null;
  }
}

/**
 * Reads ISBN barcodes live from the camera. Each frame is tried the same way
 * the photo method tries a photo (as taken, rotated, and higher contrast), and
 * scanning stops at the first valid ISBN.
 */
export function LiveBarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let stopped = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const tipTimer = setTimeout(() => {
      if (!stopped) setTip(true);
    }, TIP_AFTER_MS);

    const canvas = document.createElement("canvas");
    const reader = new MultiFormatReader();
    reader.setHints(liveHints());

    const stopCamera = () => {
      clearInterval(timer);
      clearTimeout(tipTimer);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };

    const scanFrame = () => {
      if (stopped || video.readyState < 2 || !video.videoWidth) return;
      for (const rotation of ROTATIONS) {
        for (const boost of [false, true]) {
          drawVariant(
            canvas,
            video,
            video.videoWidth,
            video.videoHeight,
            rotation,
            FRAME_MAX_SIDE,
            boost,
          );
          const text = readIsbn(reader, canvas);
          if (text) {
            stopped = true;
            stopCamera();
            onDetected(text);
            return;
          }
        }
      }
    };

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          // A sharper picture makes small or distant barcodes readable.
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then(async (s) => {
        if (stopped) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        video.srcObject = s;
        await video.play().catch(() => undefined);
        timer = setInterval(scanFrame, FRAME_INTERVAL_MS);
      })
      .catch((e: unknown) => {
        if (stopped) return;
        const denied = e instanceof DOMException && e.name === "NotAllowedError";
        setError(
          denied
            ? "Allow camera access in your browser settings, or use Capture barcode instead."
            : "The camera isn't available. Use Capture barcode instead.",
        );
      });

    return () => {
      stopped = true;
      stopCamera();
    };
    // Start the camera once, when the scanner opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const message =
    error ??
    (tip ? "Move a little closer and keep the book flat." : "Hold the barcode inside the frame");

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded border-2 border-accent" />
      <p className="absolute inset-x-0 bottom-3 px-3 text-center text-sm font-medium text-white drop-shadow">
        {message}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onClose}
        className="absolute right-2 top-2"
      >
        <X className="mr-1 h-4 w-4" /> Close
      </Button>
    </div>
  );
}
