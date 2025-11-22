'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PhotoPermission } from '@/lib/types';
import { Home, ScanFace, Images } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none md:hidden">
            <nav className="bg-[#0a0a0a]/80 backdrop-blur-[50px] saturate-150 rounded-[2rem] px-6 py-3 flex items-center gap-6 pointer-events-auto shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5 animate-slide-up">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-500",
                                isActive ? "text-white" : "text-white/40 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-pill"
                                    className="absolute inset-0 bg-linear-to-b from-white/20 to-white/5 rounded-full border border-white/20 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]"
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/10 rounded-full blur-xl" />
                                </motion.div>
                            )}
                            <span className={cn("relative z-10 transition-all duration-300", isActive ? "scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "scale-100")}>
                                {item.icon}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
