'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AnonymousPhoto, PhotoPermission } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Camera, Download, ExternalLink } from 'lucide-react';

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
      <div className="h-dvh flex items-center justify-center">
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
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center py-12 px-4 animate-fade-in relative z-10 overflow-y-auto">
        <div className="w-full max-w-4xl space-y-12 pb-24">

          {/* Header */}
          <div className="text-center space-y-6">
            <Link href="/">
              <div className="inline-flex items-center justify-center p-1.5 mb-6 glass rounded-full hover:scale-105 transition-transform cursor-pointer">
                <span className="px-4 py-1.5 text-xs font-semibold text-white uppercase tracking-widest bg-white/10 rounded-full flex items-center gap-2">
                  <ArrowLeft className="w-3 h-3" /> Back to Home
                </span>
              </div>
            </Link>
            <h1 className="text-5xl md:text-7xl font-thin tracking-tighter text-white drop-shadow-2xl">
              Find Your <br />
              <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
                Moments
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-lg mx-auto font-light">
              Upload a selfie to instantly discover photos you're in.
            </p>
          </div>

          {/* Upload Section */}
          <Card className="border-0 bg-linear-to-br from-white/5 to-white/0 backdrop-blur-3xl shadow-2xl overflow-hidden relative rounded-[2.5rem]">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
            <CardContent className="p-12 flex flex-col items-center relative z-10">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer w-64 h-64 rounded-[2rem] flex items-center justify-center transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent rounded-[2rem] border border-white/20 group-hover:border-white/40 transition-colors shadow-inner" />

                {selectedImage ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/20">
                    <Image
                      src={selectedImage}
                      alt="Selfie preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="text-white font-medium tracking-wide">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 text-white/60 group-hover:text-white transition-colors">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl shadow-inner ring-1 ring-white/10 group-hover:bg-white/10 transition-colors">
                      <Camera className="w-10 h-10" />
                    </div>
                    <span className="text-sm font-medium tracking-widest uppercase">Tap to Upload</span>
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
                <div className="mt-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-slide-up backdrop-blur-md">
                  {error}
                </div>
              )}

              <div className="mt-10 w-full max-w-xs">
                <Button
                  onClick={handleSearch}
                  disabled={!file || loading}
                  variant="liquid"
                  size="lg"
                  className="w-full text-lg font-semibold tracking-wide h-14"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Searching...
                    </div>
                  ) : 'Find My Photos'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {searched && results.length > 0 && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-3xl font-light text-white">
                  Found <span className="font-bold text-indigo-400">{results.length}</span> photos
                </h2>
                <Button onClick={downloadAll} variant="outline" className="rounded-full border-white/20 hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((photo, index) => (
                  <div
                    key={index}
                    className="group relative aspect-3/4 rounded-[2rem] overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:ring-white/30"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Image
                      src={photo.thumbnailUrl || photo.compressedUrl}
                      alt={`Match ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                      <a
                        href={photo.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Full Quality
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration Prompt */}
          {searched && results.length > 0 && (
            <Card className="border-0 bg-linear-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[2.5rem]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <CardContent className="p-12 text-center relative z-10 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">Save Your Collection</h3>
                  <p className="text-indigo-100/80 text-lg font-light max-w-xl mx-auto">
                    Create an account to save these photos and get notified when new ones are found.
                  </p>
                </div>
                <Link href="/registered">
                  <Button variant="liquid" size="lg" className="px-12 h-14 text-lg">
                    Create Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
