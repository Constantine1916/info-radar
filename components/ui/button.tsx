import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm active:scale-[0.98]",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98]",
        link: "text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-gray-900 to-gray-700 text-white hover:from-gray-800 hover:to-gray-600 shadow-lg hover:shadow-xl hover:-translate-y-1",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
