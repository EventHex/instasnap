import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
    error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, error, ...props }, ref) => {
        return (
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-2xl border-0 bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-inner",
                        icon && "pl-12",
                        error && "ring-destructive focus-visible:ring-destructive bg-destructive/5",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-destructive font-medium animate-slide-up ml-1">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
