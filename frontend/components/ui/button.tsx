import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-600",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
        success:
          "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600",
        secondary:
          "bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-400",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus-visible:ring-indigo-600",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 text-gray-700 focus-visible:ring-indigo-600",
        link: "underline-offset-4 hover:underline text-indigo-600 focus-visible:ring-indigo-600",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
