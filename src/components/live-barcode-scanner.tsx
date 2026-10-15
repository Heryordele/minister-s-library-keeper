import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { barcodeHints } from "@/lib/barcode-decode";
import { isValidIsbn, normaliseIsbn } from "@/lib/book-lookup";

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

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let stopped = false;
    const reader = new BrowserMultiFormatReader(barcodeHints(), {
      delayBetweenScanAttempts: 150,
    });

    if (!videoRef.current) return;
    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (result) => {
          if (stopped || !result) return;
          const text = normaliseIsbn(result.getText());
          if (!isValidIsbn(text)) return;
          stopped = true;
          controls?.stop();
          onDetected(text);
        },
      )
      .then((c) => {
        if (stopped) c.stop();
        else controls = c;
      })
      .catch(() => {
        if (!stopped) setError("The camera isn't available. Use Capture barcode instead.");
      });

    return () => {
      stopped = true;
      controls?.stop();
    };
    // Start the camera once, when the scanner opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded border-2 border-accent" />
      <p className="absolute inset-x-0 bottom-3 text-center text-sm font-medium text-white drop-shadow">
        {error ?? "Hold the barcode inside the frame"}
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
