import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/** État de liste vide : icône + message + action éventuelle. */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed",
        "border-slate-300 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <div className="text-slate-300">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <div>
        <p className="font-medium text-slate-700">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
