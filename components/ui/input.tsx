import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white focus:shadow-md",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
          "hover:border-gray-300 hover:bg-gray-100/50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
