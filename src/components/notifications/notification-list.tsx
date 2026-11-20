"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const hasUnread = notifications.some((n) => !n.read);

  async function markAll() {
    setPending(true);
    await markAllNotificationsReadAction();
    setPending(false);
    router.refresh();
  }

  async function open(n: NotificationItem) {
    if (!n.read) await markNotificationReadAction(n.id);
    if (n.link) router.push(n.link);
    else router.refresh();
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={markAll} disabled={pending}>
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => open(n)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                n.read
                  ? "border-slate-200 bg-white"
                  : "border-blue-200 bg-blue-50 hover:bg-blue-100",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.read ? "bg-slate-300" : "bg-blue-600",
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{n.title}</span>
                {n.body && <span className="mt-0.5 block text-sm text-slate-600">{n.body}</span>}
                <span className="mt-1 block text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
