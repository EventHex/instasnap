'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { PhotoPermission } from '@/lib/types';
import { LogOut } from 'lucide-react';

export function Navbar() {
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
    const showGallery = photoPermission?.enableEventHighlights === true;

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
                            Highlights
                        </Link>
                    )}
                    <Link href="/photos" className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                        pathname === '/photos'
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}>
                        Photos
                    </Link>
                    {isAuthenticated && (
                        <>
                            <Link href="/registered" className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                                pathname === '/registered'
                                    ? "bg-white/10 text-white shadow-inner"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}>
                                My Photos
                            </Link>
                            <button
                                onClick={() => setShowLogoutDialog(true)}
                                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </header>
        </>
    );
}
