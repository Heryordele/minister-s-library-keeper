import { useEffect, useRef, useState } from "react";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isValidIsbn, normaliseIsbn } from "@/lib/book-lookup";

/** Printed ISBNs are EAN-13 barcodes, so reading only that format is faster. */
function liveHints() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return hints;
}

/** Shown if nothing has been read after this long. */
const TIP_AFTER_MS = 6000;

/**
 * Reads ISBN barcodes live from the camera. Stops as soon as a valid ISBN is
 * seen, so no photo has to be taken.
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
    let controls: IScannerControls | undefined;
    let stopped = false;
    const reader = new BrowserMultiFormatReader(liveHints(), {
      delayBetweenScanAttempts: 80,
    });
    const tipTimer = setTimeout(() => {
      if (!stopped) setTip(true);
    }, TIP_AFTER_MS);

    if (!videoRef.current) return;
    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            // A sharper picture makes small or distant barcodes readable.
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        },
        videoRef.current,
        (result) => {
          if (stopped || !result) return;
          const text = normaliseIsbn(result.getText());
          if (!isValidIsbn(text)) return;
          stopped = true;
          clearTimeout(tipTimer);
          controls?.stop();
          onDetected(text);
        },
      )
      .then((c) => {
        if (stopped) c.stop();
        else controls = c;
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
      clearTimeout(tipTimer);
      controls?.stop();
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
