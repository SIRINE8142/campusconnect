import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RequestStatusBadge } from "@/components/ui/status-badge";
import { formatDate, levelLabel } from "@/lib/utils";
import type { HelpRequest, RequestStatus } from "@/generated/prisma/client";

type RequestWithMeta = HelpRequest & {
  author: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string | null;
    avatarUrl: string | null;
  };
  _count?: { proposals: number };
};

export function RequestCard({ request }: { request: RequestWithMeta }) {
  return (
    <Link href={`/requests/${request.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <Badge tone="violet">{request.subject}</Badge>
          <RequestStatusBadge status={request.status as RequestStatus} />
        </div>
        <h3 className="mt-3 line-clamp-1 font-semibold text-slate-900">{request.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{request.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Avatar
              firstName={request.author.firstName}
              lastName={request.author.lastName}
              url={request.author.avatarUrl}
              size="sm"
            />
            <span>
              {request.author.firstName} {request.author.lastName}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(request.createdAt)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>{levelLabel(request.level)}</span>
          {request._count && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {request._count.proposals} proposition{request._count.proposals > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
