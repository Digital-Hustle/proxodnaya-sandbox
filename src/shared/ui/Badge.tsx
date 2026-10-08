import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib";

const badge = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5", {
  variants: {
    tone: {
      neutral: "bg-secondary text-secondary-foreground",
      success: "bg-accent text-accent-foreground",
      danger: "bg-destructive/10 text-destructive",
      warning: "bg-warning/10 text-warning",
      info: "bg-info/10 text-info",
      solid: "bg-primary text-primary-foreground",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export const Badge = ({ tone, className, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) => (
  <span className={cn(badge({ tone }), className)} {...p} />
);
