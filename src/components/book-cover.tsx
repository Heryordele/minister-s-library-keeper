import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { signedCoverUrl } from "@/lib/books";
import { Badge } from "@/components/ui/badge";

export function BookCover({
  path,
  title,
  className,
}: {
  path: string | null;
  title: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    signedCoverUrl(path)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "aspect-[2/3]",
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt={`Cover of ${title}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground">
          <BookOpen className="h-7 w-7" />
        </div>
      )}
    </div>
  );
}

const READING_LABEL: Record<string, string> = {
  unread: "Unread",
  reading: "Reading",
  completed: "Completed",
};

const LENDING_LABEL: Record<string, string> = {
  available: "Available",
  borrowed: "Borrowed",
  overdue: "Overdue",
  returned: "Returned",
  lost: "Lost",
};

export function ReadingBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "completed" ? "default" : "secondary"}>
      {READING_LABEL[status] ?? status}
    </Badge>
  );
}

export function LendingBadge({ status }: { status: string }) {
  const destructive = status === "overdue" || status === "lost";
  return (
    <Badge variant={destructive ? "destructive" : "outline"}>
      {LENDING_LABEL[status] ?? status}
    </Badge>
  );
}
