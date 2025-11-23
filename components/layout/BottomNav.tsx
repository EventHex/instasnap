'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { PhotoPermission } from '@/lib/types';
import { Home, ScanFace, Images, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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

        // Check authentication status
        setIsAuthenticated(storage.isAuthenticated());

        if (eventId) {
            fetchPhotoPermission();
        }
    }, [eventId, pathname]);

    const handleLogout = () => {
        storage.clearAuth();
        setShowLogoutDialog(false);
        router.push('/');
    };

    const access = photoPermission?.photoViewAccess;
    const showAnonymous = access === 'Public';
    const showHighlights = photoPermission?.enableEventHighlights === true;

    const navItems = [
        { href: '/', icon: <Home className="w-6 h-6" />, label: 'Home', show: true, isButton: false },
        { href: '/anonymous', icon: <ScanFace className="w-6 h-6" />, label: 'Find', show: showAnonymous, isButton: false },
        { href: '/gallery', icon: <Images className="w-6 h-6" />, label: 'Gallery', show: showHighlights, isButton: false },
        { href: '/registered', icon: <User className="w-6 h-6" />, label: 'My Photos', show: isAuthenticated, isButton: false },
        { href: '#', icon: <LogOut className="w-6 h-6" />, label: 'Logout', show: isAuthenticated, isButton: true, onClick: () => setShowLogoutDialog(true) },
    ];

    const visibleItems = navItems.filter(item => item.show);

    if (visibleItems.length === 0) return null;

    return (
        <>
            {/* Logout Confirmation Dialog */}
            {showLogoutDialog && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-fade-in">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setShowLogoutDialog(false)}
                    />
                    
                    {/* Dialog */}
                    <div className="relative glass p-6 rounded-3xl max-w-sm w-full animate-scale-in shadow-2xl ring-1 ring-white/10">
                        <div className="text-center space-y-4">
                            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/30">
                                <LogOut className="w-7 h-7 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Logout Confirmation</h3>
                            <p className="text-white/60 text-sm">
                                Are you sure you want to logout? You'll need to login again to access your photos.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowLogoutDialog(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold text-sm border border-white/10 transition-all hover:scale-105 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-2xl font-semibold text-sm border border-red-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none md:hidden">
            <nav className="bg-[#0a0a0a]/80 backdrop-blur-[50px] saturate-150 rounded-[2rem] px-6 py-3 flex items-center gap-6 pointer-events-auto shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5 animate-slide-up">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    
                    if (item.isButton) {
                        return (
                            <button
                                key={item.label}
                                onClick={item.onClick}
                                className={cn(
                                    "relative w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-500",
                                    "text-white/40 hover:text-white"
                                )}
                            >
                                <span className="relative z-10 transition-all duration-300 scale-100">
                                    {item.icon}
                                </span>
                            </button>
                        );
                    }
                    
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
        </>
    );
}
