'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { EventHighlight, Person } from '@/lib/types';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { Download, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhotosPage() {
  const [photos, setPhotos] = useState<EventHighlight[]>([]);
  const [allPhotos, setAllPhotos] = useState<EventHighlight[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<EventHighlight | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  const fetchPhotos = useCallback(async (pageNum: number) => {
    try {
      const response = await api.getAllEventPhotos(eventId, pageNum, 30);
      if (response.success) {
        setAllPhotos(prev => pageNum === 1 ? response.response : [...prev, ...response.response]);
        setHasMore(response.response.length === 30);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchPeople = useCallback(async () => {
    try {
      const response = await api.getPeople(eventId);
      if (response.success) {
        setPeople(response.people);
      }
    } catch (error) {
      console.error('Failed to fetch people:', error);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchPeople();
      fetchPhotos(1);
    }
  }, [eventId, fetchPeople, fetchPhotos]);

  // Filter photos when person is selected/deselected
  useEffect(() => {
    if (selectedPerson) {
      const person = people.find(p => p.groupId === selectedPerson);
      if (person) {
        const filtered = allPhotos.filter(photo => 
          person.eventImages.includes(photo._id)
        );
        setPhotos(filtered);
      }
    } else {
      setPhotos(allPhotos);
    }
  }, [selectedPerson, people, allPhotos]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
        fetchPhotos(page + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page, fetchPhotos]);

  // Generate random heights for masonry effect
  const getRandomHeight = (index: number) => {
    const heights = ['h-64', 'h-80', 'h-96', 'h-72', 'h-60'];
    return heights[index % heights.length];
  };

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
              Photo <br />
              <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
                Gallery
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
              {selectedPerson 
                ? `Showing photos of ${people.find(p => p.groupId === selectedPerson)?.matchCount || 0} moments`
                : 'Browse all photos from the event in our complete collection.'}
            </p>
          </div>

          {/* People Filter Row */}
          {people.length > 0 && (
            <div className="w-full overflow-x-auto pb-4 -mx-6 px-6">
              <div className="flex gap-4 min-w-max">
                {/* All Photos Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedPerson(null)}
                  className={`shrink-0 group relative transition-all duration-300 ${
                    !selectedPerson ? 'scale-110' : 'scale-100 hover:scale-105'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-full glass border-2 transition-all duration-300 flex items-center justify-center ${
                    !selectedPerson 
                      ? 'border-violet-400 shadow-lg shadow-violet-500/50' 
                      : 'border-white/20 hover:border-white/40'
                  }`}>
                    <span className="text-2xl">📷</span>
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs text-white/60 font-medium">All Photos</span>
                  </div>
                </motion.button>

                {/* People Faces */}
                {people.slice(0, 20).map((person, index) => (
                  <motion.button
                    key={person.groupId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedPerson(person.groupId === selectedPerson ? null : person.groupId)}
                    className={`shrink-0 group relative transition-all duration-300 ${
                      selectedPerson === person.groupId ? 'scale-110' : 'scale-100 hover:scale-105'
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-full overflow-hidden glass border-2 transition-all duration-300 ${
                      selectedPerson === person.groupId 
                        ? 'border-violet-400 shadow-lg shadow-violet-500/50' 
                        : 'border-white/20 hover:border-white/40'
                    }`}>
                      <Image
                        src={person.representativeFace}
                        alt={`Person ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-white/5 text-white/40 text-2xl font-bold">?</div>`;
                          }
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-white/60 font-medium">{person.matchCount}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Masonry Gallery Grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo._id}
                  ref={index === photos.length - 1 ? lastElementRef : null}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className={`group relative ${getRandomHeight(index)} rounded-2xl md:rounded-3xl overflow-hidden glass hover:scale-[1.02] transition-all duration-500 cursor-pointer`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <Image
                    src={photo.thumbnail || photo.compressed}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          ) : !loading && (
            <div className="glass p-12 rounded-3xl text-center">
              <p className="text-white/60 text-lg">No photos available yet.</p>
            </div>
          )}

          {loading && page === 1 && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full max-h-[90vh] rounded-3xl overflow-hidden glass"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[80vh]">
                <Image
                  src={selectedPhoto.image}
                  alt="Full size"
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-6">
                <div className="flex gap-3 justify-center">
                  <a
                    href={selectedPhoto.image}
                    download
                    className="px-6 py-3 bg-white/90 hover:bg-white text-black rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <a
                    href={selectedPhoto.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
