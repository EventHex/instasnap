"use client"

import { usePathname } from "next/navigation"

export function Header() {
    const pathname = usePathname()

    const getTitle = () => {
        switch (pathname) {
            case "/": return "Welcome"
            case "/registered": return "My Profile"
            case "/gallery": return "Event Highlights"
            default: return "InstaSnap"
        }
    }

    return (
        <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-40">
            <h2 className="text-lg font-semibold text-foreground">
                {getTitle()}
            </h2>
            <div className="flex items-center space-x-4">
                {/* Add user menu or notifications here later */}
            </div>
        </header>
    )
}
