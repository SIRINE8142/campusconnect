import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none " +
  "focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(baseField, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(baseField, "min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(baseField, className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)}
      {...props}
    />
  );
}

/** Message d'erreur de champ (React Hook Form). */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}
