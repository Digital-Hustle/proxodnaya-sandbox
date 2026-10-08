import { cn } from "@/shared/lib";

const TONES = ["bg-sber-green", "bg-sber-blue", "bg-sber-sky", "bg-sber-arctic", "bg-primary", "bg-info"];

export const Avatar = ({ name, photo, className }: { name: string; photo?: string; className?: string }) => {
  const initials = name.split(" ").slice(0, 2).map((p) => p[0]).join("");
  const tone = TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];
  return photo ? (
    <img src={photo} alt={name} className={cn("size-10 shrink-0 rounded-full object-cover", className)} />
  ) : (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", tone, className)} aria-label={name}>{initials}</span>
  );
};
