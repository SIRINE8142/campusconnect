import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "amber" | "red" | "slate" | "violet";

const tones: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-700",
  violet: "bg-violet-100 text-violet-800",
};

export function Badge({
  tone = "blue",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
