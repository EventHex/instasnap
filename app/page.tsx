'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PhotoPermission } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout/Footer';
import { ScanFace, Lock, ArrowRight, Images } from 'lucide-react';

export default function HomePage() {
  const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPhotoPermission();
    }
  }, [eventId]);

  const access = photoPermission?.photoViewAccess;

  // Determine Primary Action based on photoViewAccess (matching specification table)
  let primaryAction: 'login' | 'match' | 'gallery' = 'login'; // Default
  
  if (access === 'Public') {
    primaryAction = 'match'; // Show Quick Match for Public
  } else if (access === 'Everyone') {
    primaryAction = 'gallery'; // Direct gallery access for Everyone (no Quick Match)
  } else {
    primaryAction = 'login'; // Show login for Attendees
  }

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-8 pt-4 pb-16 px-6 md:pt-24 md:pb-8 relative z-10">
        
        {/* Top Section: Hero & Branding */}
        <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 max-w-3xl w-full mt-0 md:mt-0">
          <div className="inline-flex items-center justify-center p-1.5 glass rounded-full animate-float">
            <span className="px-4 py-1.5 text-[10px] md:text-xs font-semibold text-white uppercase tracking-widest bg-white/5 rounded-full">
              AI-Powered Event Photos
            </span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-thin tracking-tighter text-balance text-center text-white drop-shadow-2xl">
            Your Moments, <br />
            <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
              Instantly Found.
            </span>
          </h1>
          
          <p className="text-base md:text-xl text-white/60 max-w-xl mx-auto text-balance font-light leading-relaxed text-center">
            {primaryAction === 'match'
              ? "Upload a selfie and let our liquid AI find every photo you're in."
              : primaryAction === 'gallery'
              ? "Browse all event photos freely. No login required."
              : "Login to access your personalized photo collection from the event."}
          </p>
        </div>

        {/* Middle Section: Main Action Card */}
        <div className="w-full max-w-md md:max-w-lg perspective-1000 md:my-0">
          {primaryAction === 'match' && (
            <Link href="/anonymous" className="group block transform transition-transform duration-500 hover:scale-105 active:scale-95">
              <div className="flex items-center p-3 pr-4 bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] relative overflow-hidden w-full">
                 <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="w-12 h-12 rounded-full bg-linear-to-tr from-white/10 to-white/5 flex items-center justify-center text-xl shadow-inner ring-1 ring-white/20 shrink-0">
                    <ScanFace className="w-6 h-6 text-white" />
                  </div>
                 
                 <div className="flex-1 px-4 text-left">
                    <h2 className="text-lg font-bold text-white tracking-tight">Find My Photos</h2>
                    <p className="text-indigo-100/60 text-xs font-light">Quick face scan search</p>
                 </div>
                 
                 <div className="px-5 py-2 rounded-full bg-white/10 group-hover:bg-white/20 text-white text-sm font-semibold transition-all duration-300 flex items-center gap-2 shrink-0">
                    Scan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            </Link>
          )}

          {primaryAction === 'gallery' && (
            <Link href="/gallery" className="group block transform transition-transform duration-500 hover:scale-105 active:scale-95">
              <div className="flex items-center p-3 pr-4 bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)] relative overflow-hidden w-full">
                 <div className="absolute inset-0 bg-linear-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="w-12 h-12 rounded-full bg-linear-to-tr from-white/10 to-white/5 flex items-center justify-center text-xl shadow-inner ring-1 ring-white/20 shrink-0">
                    <Images className="w-6 h-6 text-white" />
                 </div>
                 
                 <div className="flex-1 px-4 text-left">
                    <h2 className="text-lg font-bold text-white tracking-tight">View Gallery</h2>
                    <p className="text-green-100/60 text-xs font-light">Browse all event photos</p>
                 </div>
                 
                 <div className="px-5 py-2 rounded-full bg-white/10 group-hover:bg-white/20 text-white text-sm font-semibold transition-all duration-300 flex items-center gap-2 shrink-0">
                    Browse <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            </Link>
          )}

          {primaryAction === 'login' && (
            <Link href="/registered" className="group block transform transition-transform duration-500 hover:scale-105 active:scale-95">
              <div className="flex items-center p-3 pr-4 bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_-10px_rgba(148,163,184,0.3)] relative overflow-hidden w-full">
                 <div className="absolute inset-0 bg-linear-to-r from-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="w-12 h-12 rounded-full bg-linear-to-tr from-white/10 to-white/5 flex items-center justify-center text-xl shadow-inner ring-1 ring-white/20 shrink-0">
                    <Lock className="w-6 h-6 text-white" />
                 </div>
                 
                 <div className="flex-1 px-4 text-left">
                    <h2 className="text-lg font-bold text-white tracking-tight">Access</h2>
                    <p className="text-slate-200/60 text-xs font-light">Login to view your photos</p>
                 </div>
                 
                 <div className="px-5 py-2 rounded-full bg-white/10 group-hover:bg-white/20 text-white text-sm font-semibold transition-all duration-300 flex items-center gap-2 shrink-0">
                    Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            </Link>
          )}
        </div>

        {/* Bottom Section: Secondary Actions */}
        <div className="flex flex-col items-center gap-4 animate-fade-in delay-200 w-full">
          {access === 'Everyone' && (
            <div className="text-center space-y-3 md:space-y-4 w-full">
              <p className="text-xs md:text-sm text-white/40 font-light tracking-wide">
                {primaryAction === 'gallery' ? 'Have a personal account?' : 'Already have an account?'}
              </p>
              <Link href="/registered" className="block w-full max-w-xs mx-auto">
                <Button variant="outline" className="w-full border-white/10 hover:bg-white/10 hover:border-white/20 rounded-full h-12 md:h-14 text-base md:text-lg backdrop-blur-md">
                  Browse your photos
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
