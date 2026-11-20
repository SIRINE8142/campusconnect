import { cn, initials } from "@/lib/utils";

export function Avatar({
  firstName,
  lastName,
  url,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  url?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-xl" };
  if (url) {
     
    return (
      <img
        src={url}
        alt={`${firstName} ${lastName}`}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-blue-700 font-semibold text-white",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </div>
  );
}
