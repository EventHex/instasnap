"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    const navItems = [
        {
            href: "/", label: "Home", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            href: "/gallery", label: "Highlights", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
    ]

    return (
        <div className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-border bg-white/50 backdrop-blur-xl z-50">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-linear-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                    InstaSnap
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.href)
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-indigo-900 mb-1">Event Status</p>
                    <div className="flex items-center space-x-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-indigo-700">Live Now</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
