import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib";
import { press } from "@/shared/config/motion";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors duration-fast outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs",
        secondary: "bg-secondary text-secondary-foreground hover:bg-border",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        accent: "bg-accent text-accent-foreground hover:opacity-90",
        glass: "bg-card/70 text-foreground backdrop-blur-md border border-border/60 hover:bg-card",
      },
      size: {
        sm: "h-control-sm rounded-sm px-3 text-sm [&_svg]:size-4",
        md: "h-control-md rounded-md px-5 text-base [&_svg]:size-5",
        lg: "h-control-lg rounded-lg px-6 text-lg [&_svg]:size-5",
        xl: "h-control-xl rounded-xl px-8 text-xl [&_svg]:size-6",
        icon: "size-control-sm rounded-sm [&_svg]:size-5",
        "icon-lg": "size-control-md rounded-md [&_svg]:size-6",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & VariantProps<typeof buttonVariants> & { children?: React.ReactNode };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <motion.button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...press} {...props} />
));
Button.displayName = "Button";
