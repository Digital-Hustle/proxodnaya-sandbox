import { cn } from "@/shared/lib";

export const EmptyState = ({ icon, title, text, action, className }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
    {icon && <div className="flex size-14 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-7">{icon}</div>}
    <div className="font-display text-lg font-semibold">{title}</div>
    {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
    {action}
  </div>
);
