import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  asChild?: boolean
  href?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, href, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-white text-zinc-950 hover:bg-zinc-200",
      outline: "border border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700",
      ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800"
    }
    
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-8 text-base rounded-full"
    }

    const classes = cn(baseStyles, variants[variant], sizes[size], className)

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      )
    }

    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
