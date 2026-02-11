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
      default: "bg-[#1A1814] text-white hover:bg-black",
      outline: "border border-[#D4D4D4] bg-transparent text-[#1A1814] hover:bg-[#FAFAFA] hover:border-[#A3A3A3]",
      ghost: "text-[#3D2C22] hover:text-[#1A1814] hover:bg-[#F5F5F5]"
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
