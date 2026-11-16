import { cn } from "@/lib/utils/cn";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
} as const;

export function ParticipantAvatar({
  name,
  colorIndex,
  size = "md",
  className,
}: {
  name: string;
  colorIndex: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide text-white select-none",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: getAvatarColor(colorIndex) }}
    >
      {getInitials(name)}
    </span>
  );
}
