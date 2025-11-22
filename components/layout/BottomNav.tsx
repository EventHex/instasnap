'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PhotoPermission } from '@/lib/types';
import { Home, ScanFace, Images } from 'lucide-react';

export function BottomNav() {
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
    const showAnonymous = access !== 'Everyone' && access !== 'Attendees';
    const showHighlights = photoPermission?.enableEventHighlights === true;

    const navItems = [
        { href: '/', icon: <Home className="w-6 h-6" />, label: 'Home', show: true },
        { href: '/anonymous', icon: <ScanFace className="w-6 h-6" />, label: 'Find', show: showAnonymous },
        { href: '/gallery', icon: <Images className="w-6 h-6" />, label: 'Gallery', show: showHighlights },
    ];

    const visibleItems = navItems.filter(item => item.show);

    if (visibleItems.length === 0) return null;

    return (
        <div className="fixed bottom-14 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none md:hidden">
            <nav className="glass rounded-full px-2 py-2 flex items-center gap-1 pointer-events-auto shadow-2xl ring-1 ring-white/10 animate-slide-up">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500",
                                isActive ? "text-white" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse-slow" />
                            )}
                            {isActive && (
                                <div className="absolute inset-0 bg-linear-to-tr from-primary/40 to-accent/40 rounded-full shadow-inner" />
                            )}
                            <span className={cn("relative z-10 text-xl transition-transform duration-300", isActive ? "scale-110" : "scale-100")}>
                                {item.icon}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
