'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
    const pathname = usePathname();

    return (
        <header className="hidden md:flex fixed top-6 left-0 right-0 z-50 justify-center px-4 pointer-events-none">
            <nav className="glass rounded-full px-6 py-3 flex items-center gap-8 pointer-events-auto animate-slide-up shadow-2xl ring-1 ring-white/10">
                <Link href="/" className="font-bold text-xl tracking-tight hover:scale-105 transition-transform">
                    <span className="text-gradient-primary">InstaSnap</span>
                </Link>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-1">
                    <Link href="/" className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                        pathname === '/'
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}>
                        Home
                    </Link>
                    <Link href="/gallery" className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                        pathname === '/gallery'
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}>
                        Gallery
                    </Link>
                </div>
            </nav>
        </header>
    );
}
