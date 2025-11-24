'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { EventHighlight } from '@/lib/types';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { Download, ExternalLink, ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GalleryPage() {
  const [highlights, setHighlights] = useState<EventHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<EventHighlight | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  const fetchHighlights = useCallback(async (pageNum: number) => {
    try {
      const response = await api.getEventHighlights(eventId, pageNum, 20);
      if (response.success) {
        setHighlights(prev => pageNum === 1 ? response.response : [...prev, ...response.response]);
        setHasMore(response.response.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchHighlights(1);
    }
  }, [eventId, fetchHighlights]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
        fetchHighlights(page + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page, fetchHighlights]);

    return (
        <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

            <div className="flex-1 flex flex-col items-center pt-24 md:pt-32 py-8 px-6 animate-fade-in relative z-10 overflow-y-auto">
                <div className="w-full max-w-7xl space-y-12 pb-24">

                    {/* Header */}
                    <div className="text-center space-y-6">
                        <h1 className="text-5xl md:text-7xl font-thin tracking-tighter text-white drop-shadow-2xl">
                            Event <br />
                            <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
                                Highlights
                            </span>
                        </h1>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
                            The most memorable moments, captured beautifully.
                        </p>
                    </div>          {/* Gallery Grid - Masonry Layout */}
          {highlights.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 md:gap-3 space-y-2 md:space-y-3"
            >
              {highlights.map((photo, index) => {
                // Create mosaic pattern with varying heights
                const patterns = [
                  'h-48', 'h-64', 'h-80', 'h-56', 'h-72', 
                  'h-52', 'h-60', 'h-96', 'h-44', 'h-68'
                ];
                const randomHeight = patterns[index % patterns.length];
                
                return (
                  <motion.div
                    key={photo._id}
                    ref={index === highlights.length - 1 ? lastElementRef : null}
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
                        alt={`Highlight ${index + 1}`}
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
          ) : !loading && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white/5 text-5xl mb-6 shadow-inner ring-1 ring-white/10">
                <ImageIcon className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Highlights Yet</h3>
              <p className="text-white/60">Check back later for photos from the event.</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                    alt="Event highlight"
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
