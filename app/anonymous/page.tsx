'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { AnonymousPhoto, PhotoPermission } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Camera, Download, ExternalLink, Sparkles, Search, UserPlus, RefreshCw } from 'lucide-react';

export default function AnonymousMatchPage() {
  const router = useRouter();
  const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnonymousPhoto[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  // iOS 26 Liquid Glass Styles (Consistent with Registered Page)
  const iosCardClass = "bg-[#1c1c1e]/70 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-[2.5rem] overflow-hidden relative ring-1 ring-white/5 transition-all duration-500";
  const iosButtonPrimaryClass = "w-full py-4 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-bold text-lg hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)] border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden after:absolute after:inset-0 after:bg-linear-to-t after:from-black/10 after:to-transparent after:pointer-events-none";
  const iosButtonSecondaryClass = "w-full py-4 bg-[#2c2c2e]/80 text-white rounded-full font-semibold text-lg hover:bg-[#3a3a3c] hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/5 flex items-center justify-center gap-2 backdrop-blur-md";

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
      setLoading(false);
      setSearched(true);
    }
  };

  // Find More Photos using stored selfie
  const handleFindMore = async () => {
    const storedSelfie = storage.getAnonymousSelfie();
    if (!storedSelfie || !eventId) {
      setError('No stored selfie found. Please upload again.');
      return;
    }

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
      setLoading(false);
    }
  };

  const downloadAll = async () => {
    for (const photo of results) {
      try {
        const link = document.createElement('a');
        link.href = photo.originalUrl;
        link.download = `photo-${photo.imageId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('Failed to download photo:', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-black selection:bg-white/20 font-sans">
      {/* iOS 18 Style Background - Abstract Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse-slow pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[60%] bg-purple-600/20 rounded-full blur-[150px] animate-pulse-slow delay-1000 pointer-events-none mix-blend-screen" />

      <div className="flex-1 flex flex-col items-center py-8 px-4 relative z-10 overflow-y-auto">
        <div className="w-full max-w-4xl space-y-8 pb-24">

          {/* Header */}
          <div className="text-center space-y-6 animate-fade-in">
            <Link href="/">
              <div className="inline-flex items-center justify-center p-1 mb-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full border border-white/10 transition-all cursor-pointer group">
                <span className="px-4 py-1.5 text-xs font-semibold text-white/80 uppercase tracking-widest flex items-center gap-2">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back
                </span>
              </div>
            </Link>
            <h1 className="text-4xl font-medium tracking-tight text-white drop-shadow-2xl">
              Find Your Moments
            </h1>
            <p className="text-lg text-white/50 font-light max-w-lg mx-auto">
              Upload a selfie to instantly discover photos you're in.
            </p>
          </div>

          {/* Upload Section */}
          {!searched && (
            <div className={`${iosCardClass} max-w-md mx-auto animate-fade-in`}>
              <div className="p-8 flex flex-col items-center space-y-8 relative z-10">
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer w-64 h-64 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 hover:scale-105 bg-black/20 border border-white/5 overflow-hidden"
                >
                  {selectedImage ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={selectedImage}
                        alt="Selfie preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <span className="text-white font-medium tracking-wide">Change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4 text-white/40 group-hover:text-white transition-colors">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl shadow-inner ring-1 ring-white/5 group-hover:bg-white/10 transition-colors">
                        <Camera className="w-8 h-8" />
                      </div>
                      <span className="text-sm font-bold tracking-widest uppercase">Tap to Upload</span>
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
                    className={iosButtonPrimaryClass}
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
            <div className="space-y-8 animate-fade-in w-full">
              <div className={iosCardClass}>
                <div className="p-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl shadow-inner ring-1 ring-white/5">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                          {results.length} Photo{results.length !== 1 ? 's' : ''}
                        </h2>
                        <p className="text-white/60 font-light">Found matching your selfie</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      {results.length > 0 && (
                        <button
                          onClick={downloadAll}
                          className={`${iosButtonPrimaryClass} w-auto! px-8`}
                        >
                          <Download className="w-4 h-4" />
                          Download All
                        </button>
                      )}
                      {storage.hasAnonymousSelfie() && (
                        <button
                          onClick={handleFindMore}
                          disabled={loading}
                          className={`${iosButtonPrimaryClass} w-auto! px-8 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30`}
                        >
                          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                          {loading ? 'Finding...' : 'Find More Photos'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSearched(false);
                          setFile(null);
                          setSelectedImage(null);
                          setResults([]);
                        }}
                        className={`${iosButtonSecondaryClass} w-auto! px-8`}
                      >
                        <Search className="w-4 h-4" />
                        New Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.map((photo, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square rounded-[2rem] overflow-hidden bg-[#1c1c1e]/50 backdrop-blur-md border border-white/5 hover:scale-105 transition-all duration-500 animate-fade-in cursor-pointer shadow-lg"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Image
                        src={photo.thumbnailUrl || photo.compressedUrl}
                        alt={`Match ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <a
                          href={photo.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-white/20 backdrop-blur-xl text-white text-sm font-bold rounded-full hover:bg-white/30 transition-colors border border-white/20 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={iosCardClass}>
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
                        className={iosButtonPrimaryClass}
                      >
                        Try Another Selfie
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Registration Prompt */}
              {results.length > 0 && (
                <div className={`${iosCardClass} mt-8`}>
                  <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="text-center md:text-left space-y-2">
                      <h3 className="text-xl font-bold text-white">Save Your Collection</h3>
                      <p className="text-white/60 font-light max-w-md">
                        Create an account to save these photos and get notified when new ones are found.
                      </p>
                    </div>
                    <Link href="/registered" className="w-full md:w-auto">
                      <button className={`${iosButtonSecondaryClass} w-full md:w-auto px-8 bg-white/10 hover:bg-white/20`}>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </button>
                    </Link>
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
