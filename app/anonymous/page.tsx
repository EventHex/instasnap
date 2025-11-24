'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { AnonymousPhoto, PhotoPermission } from '@/lib/types';
import { AIMatchingLoader } from '@/components/ui/AIMatchingLoader';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Camera, ExternalLink, Sparkles, Search, UserPlus } from 'lucide-react';

export default function AnonymousMatchPage() {
  const router = useRouter();
  const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAILoader, setShowAILoader] = useState(false);
  const [results, setResults] = useState<AnonymousPhoto[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  // Glassmorphism Styles - Match Home Page
  const cardClass = "glass p-8 space-y-6 animate-fade-in hover:scale-[1.01] transition-transform duration-500";
  const buttonPrimaryClass = "w-full py-4 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-base hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-[0.98] transition-all shadow-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden";
  const buttonSecondaryClass = "w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold text-base hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 flex items-center justify-center gap-2 backdrop-blur-xl";

  useEffect(() => {
    const fetchPhotoPermission = async () => {
      try {
        const response = await api.getPhotoPermission(eventId);
        if (response.success && response.response.length > 0) {
          const permission = response.response[0];
          setPhotoPermission(permission);
          
          // Redirect if Quick Match is not allowed (Everyone or Attendees mode)
          const access = permission.photoViewAccess;
          if (access === 'Everyone' || access === 'Attendees') {
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch photo permissions:', error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPhotoPermission();
  }, [eventId, router]);

  if (isLoadingPermissions) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setSearched(false);
      setResults([]);
    }
  };

  const handleSearch = async () => {
    if (!file || !eventId) return;

    setShowAILoader(true);
    setLoading(true);
    setError(null);
    try {
      const response = await api.matchAnonymous(file, eventId);
      if (response.success) {
        setResults(response.photos);
        // Store selfie for "Find More Photos" feature
        storage.setAnonymousSelfie(file);
        console.log('[Anonymous] Stored selfie for later re-matching');
      } else {
        setError(response.message || 'No matches found');
      }
    } catch (err) {
      setError('Failed to search for photos. Please try again.');
      console.error(err);
    } finally {
      setTimeout(() => {
        setShowAILoader(false);
        setLoading(false);
        setSearched(true);
      }, 1000);
    }
  };

  // Find More Photos using stored selfie
  const handleFindMore = async () => {
    const storedSelfie = storage.getAnonymousSelfie();
    if (!storedSelfie || !eventId) {
      setError('No stored selfie found. Please upload again.');
      return;
    }

    setShowAILoader(true);
    setLoading(true);
    setError(null);
    try {
      console.log('[Anonymous] Re-matching with stored selfie...');
      const response = await api.matchAnonymous(storedSelfie, eventId);
      if (response.success) {
        setResults(response.photos);
        console.log(`[Anonymous] Found ${response.photos.length} photos using stored selfie`);
      } else {
        setError(response.message || 'No matches found');
      }
    } catch (err) {
      setError('Failed to search for photos. Please try again.');
      console.error(err);
    } finally {
      setTimeout(() => {
        setShowAILoader(false);
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* AI Matching Loader */}
      <AIMatchingLoader show={showAILoader} />
      
      {/* Ambient Background Effects - Match Home Page */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center py-8 px-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8 pb-24">

          {/* Header */}
          <div className="text-center space-y-4 md:space-y-6 animate-fade-in">
            <Link href="/">
              <div className="inline-flex items-center justify-center p-1.5 glass rounded-full animate-float hover:scale-105 transition-transform cursor-pointer">
                <span className="px-4 py-1.5 text-[10px] md:text-xs font-semibold text-white uppercase tracking-widest bg-white/5 rounded-full flex items-center gap-2">
                  <ArrowLeft className="w-3 h-3" /> Back to Home
                </span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-6xl font-thin tracking-tighter text-white drop-shadow-2xl">
              Find Your <br />
              <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
                Moments
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto text-balance font-light leading-relaxed">
              Upload a selfie and let our AI find every photo you&apos;re in.
            </p>
          </div>

          {/* Upload Section */}
          {!searched && (
            <div className={cardClass}>
              <div className="flex flex-col items-center space-y-6">
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer w-full max-w-xs aspect-square rounded-3xl flex items-center justify-center transition-all duration-500 hover:scale-105 glass overflow-hidden"
                >
                  {selectedImage ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={selectedImage}
                        alt="Selfie preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <span className="px-6 py-3 bg-white/90 text-black font-bold rounded-xl">Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4 text-white/50 group-hover:text-white transition-colors p-8">
                      <div className="w-20 h-20 rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                        <Camera className="w-9 h-9" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold tracking-wide">Tap to Upload</p>
                        <p className="text-sm text-white/40 mt-1">Your selfie photo</p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-slide-up backdrop-blur-md text-center w-full">
                    {error}
                  </div>
                )}

                <div className="w-full pt-2">
                  <button
                    onClick={handleSearch}
                    disabled={!file || loading}
                    className={buttonPrimaryClass}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Find My Photos
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {searched && (
            <div className="space-y-6 animate-fade-in w-full">
              {/* Stats Card */}
              <div className="glass p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10">
                      <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {results.length} Photo{results.length !== 1 ? 's' : ''}
                      </h2>
                      <p className="text-white/60 font-light text-sm md:text-base">Found matching your selfie</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                    {storage.hasAnonymousSelfie() && (
                      <button
                        onClick={handleFindMore}
                        disabled={loading}
                        className="px-6 py-3 bg-linear-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white rounded-2xl font-semibold text-sm border border-purple-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-xl"
                      >
                        <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Find More
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSearched(false);
                        setFile(null);
                        setSelectedImage(null);
                        setResults([]);
                      }}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold text-sm border border-white/10 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-xl"
                    >
                      <Search className="w-4 h-4" />
                      New Search
                    </button>
                  </div>
                </div>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {results.map((photo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="group relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden glass hover:scale-[1.03] transition-all duration-500 cursor-pointer"
                    >
                      <Image
                        src={photo.thumbnailUrl || photo.compressedUrl}
                        alt={`Match ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                        <a
                          href={photo.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-white/90 backdrop-blur-xl text-black text-sm font-bold rounded-xl hover:bg-white transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={cardClass}>
                  <div className="p-12 text-center space-y-4 relative z-10">
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-white/40" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">No Photos Found</h3>
                    <p className="text-white/60 font-light max-w-md mx-auto">
                      We couldn't find any photos matching your selfie.
                    </p>
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          setSearched(false);
                          setFile(null);
                          setSelectedImage(null);
                          setResults([]);
                        }}
                        className={buttonPrimaryClass}
                      >
                        Try Another Selfie
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
