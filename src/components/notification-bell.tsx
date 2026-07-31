import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Clock, Flame, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  generateNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsKey,
  relativeTime,
  type Notification,
} from "@/lib/notifications";

const ICONS = {
  lending_reminder: Clock,
  overdue: BellRing,
  habit_nudge: Flame,
} as const;

export function NotificationBell({ className }: { className?: string }) {
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: notificationsKey,
    queryFn: fetchNotifications,
  });

  useEffect(() => {
    generateNotifications()
      .then((created) => {
        if (created > 0) qc.invalidateQueries({ queryKey: notificationsKey });
      })
      .catch(() => undefined);
  }, [qc]);

  const unread = (notifications ?? []).filter((n) => !n.read_at).length;

  const read = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey }),
  });
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-serif text-sm font-semibold">Notifications</h2>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (notifications ?? []).length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium">All quiet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lending reminders and reading nudges will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y divide-border">
              {(notifications ?? []).map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={() => !n.read_at && read.mutate(n.id)}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const Icon = ICONS[n.type] ?? Bell;
  return (
    <li>
      <button
        type="button"
        onClick={onRead}
        className={cn(
          "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
          !n.read_at && "bg-accent/5",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
            n.type === "overdue"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug">{n.message}</span>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {relativeTime(n.created_at)}
          </span>
        </span>
        {!n.read_at && (
          <span
            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
            aria-hidden
          />
        )}
      </button>
    </li>
  );
}
