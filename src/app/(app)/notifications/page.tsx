import { Bell } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { NotificationList } from "@/components/notifications/notification-list";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Propositions, acceptations, séances et évaluations te concernant.
        </p>
      </div>
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="Aucune notification"
          description="Tu seras notifié ici des événements liés à tes demandes et séances."
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
