'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PhotoPermission } from '@/lib/types';

export function Navbar() {
    const pathname = usePathname();
    const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
    const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

    useEffect(() => {
        const fetchPhotoPermission = async () => {
            try {
                const response = await api.getPhotoPermission(eventId);
                if (response.success && response.response.length > 0) {
                    setPhotoPermission(response.response[0]);
                }
            } catch (error) {
                console.error('Failed to fetch photo permissions:', error);
            }
        };

        if (eventId) {
            fetchPhotoPermission();
        }
    }, [eventId]);

    const access = photoPermission?.photoViewAccess;
    const showAnonymous = access === 'Public';
    const showGallery = photoPermission?.enableEventHighlights === true;

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
                    {showAnonymous && (
                        <Link href="/anonymous" className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                            pathname === '/anonymous'
                                ? "bg-white/10 text-white shadow-inner"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}>
                            Find Photos
                        </Link>
                    )}
                    {showGallery && (
                        <Link href="/gallery" className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                            pathname === '/gallery'
                                ? "bg-white/10 text-white shadow-inner"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}>
                            Gallery
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}
