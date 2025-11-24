'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EventPhoto } from '@/lib/types';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Download, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  useEffect(() => {
    const fetchPersonPhotos = async () => {
      try {
        const response = await api.getPersonPhotos(groupId, eventId);
        if (response.success) {
          setPhotos(response.photos);
        }
      } catch (error) {
        console.error('Failed to fetch person photos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId && groupId) {
      fetchPersonPhotos();
    }
  }, [eventId, groupId]);

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24">

          {/* Header with Back Button */}
          <div className="mt-20 md:mt-24 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group mb-6"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to People</span>
            </button>

            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-6 md:p-8 backdrop-blur-xl border border-white/10 relative overflow-hidden"
            >
              {/* Gradient Accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl -z-10" />
              
              <div className="relative z-10">
                <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 mb-3">
                  Person Photos
                </h1>
                <p className="text-sm md:text-base text-white/50">
                  {loading ? 'Loading photos...' : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} featuring this person`}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-fuchsia-500/20 border-t-fuchsia-400 rounded-full animate-spin animate-delay-150" />
              </div>
            </div>
          )}

          {/* Masonry Gallery Grid */}
          {!loading && photos.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 md:gap-3 space-y-2 md:space-y-3 mt-8"
            >
              {photos.map((photo, index) => {
                // Create mosaic pattern with varying heights
                const patterns = [
                  'h-48', 'h-64', 'h-80', 'h-56', 'h-72', 
                  'h-52', 'h-60', 'h-96', 'h-44', 'h-68'
                ];
                const randomHeight = patterns[index % patterns.length];
                
                return (
                  <motion.div
                    key={photo._id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.01, 0.3), duration: 0.4 }}
                    className={`group relative ${randomHeight} rounded-xl md:rounded-2xl overflow-hidden cursor-pointer break-inside-avoid mb-2 md:mb-3`}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    {/* Image */}
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm">
                      <Image
                        src={photo.thumbnail}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                      />
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subtle Border */}
                    <div className="absolute inset-0 rounded-xl md:rounded-2xl ring-1 ring-white/10 group-hover:ring-violet-400/50 transition-all duration-300" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && photos.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-white mb-2">No Photos Found</h3>
              <p className="text-white/60">This person has no photos yet.</p>
            </div>
          )}

        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
              onClick={() => setSelectedPhoto(null)}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-7xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-[80vh]">
                  <Image
                    src={selectedPhoto.image}
                    alt="Full size photo"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-6">
                  <div className="flex gap-3 justify-center">
                    <a
                      href={selectedPhoto.image}
                      download
                      className="flex items-center gap-2 px-6 py-3 glass rounded-xl hover:bg-white/10 transition-colors text-white font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </a>
                    <a
                      href={selectedPhoto.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 glass rounded-xl hover:bg-white/10 transition-colors text-white font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
