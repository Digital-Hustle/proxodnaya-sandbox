import { forwardRef } from "react";
import { cn } from "@/shared/lib";

export const inputClass = "h-control-md w-full rounded-md border border-input bg-card px-4 text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors duration-fast focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...p} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(inputClass, "appearance-none bg-no-repeat pr-10", className)} {...p} />
));
Select.displayName = "Select";

export const Field = ({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) => (
  <label className={cn("flex flex-col gap-2", className)}>
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    {children}
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </label>
);
