import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_0_20px_-5px_rgba(91,108,249,0.5)] hover:shadow-[0_0_30px_-5px_rgba(91,108,249,0.7)]",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
                outline:
                    "border border-white/10 bg-transparent hover:bg-white/5 text-white hover:border-white/20",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
                ghost: "hover:bg-white/5 hover:text-white",
                link: "text-primary underline-offset-4 hover:underline",
                glass: "glass hover:bg-glass-hover text-foreground shadow-lg backdrop-blur-xl border-white/10",
                liquid: "relative overflow-hidden bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-[0_4px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_40px_rgba(99,102,241,0.6)] border border-white/20",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-full px-4 text-xs",
                lg: "h-14 rounded-full px-8 text-base",
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
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
