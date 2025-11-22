'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { EventHighlight } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Image as ImageIcon, ExternalLink, Download } from 'lucide-react';

export default function GalleryPage() {
  const [highlights, setHighlights] = useState<EventHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center py-12 px-4 animate-fade-in relative z-10 overflow-y-auto">
        <div className="w-full max-w-7xl space-y-12 pb-24">

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
              Event <br />
              <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-shimmer bg-size-[200%_auto]">
                Highlights
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
              A curated collection of the best moments from the event.
            </p>
          </div>

          {/* Gallery Grid */}
          {highlights.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {highlights.map((photo, index) => (
                <div
                  key={photo._id}
                  ref={index === highlights.length - 1 ? lastElementRef : null}
                  className="break-inside-avoid group relative rounded-[2rem] overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:ring-white/30"
                >
                  <div className="relative w-full">
                    <Image
                      src={photo.thumbnail}
                      alt="Event highlight"
                      width={500}
                      height={500}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                      <a
                        href={photo.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Full Quality
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
      </div>
      <Footer />
    </div>
  );
}
