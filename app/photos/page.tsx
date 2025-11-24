'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { EventHighlight, Person, Album } from '@/lib/types';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { Download, ExternalLink, X, Share2, ChevronLeft, ChevronRight, Play, Pause, FolderOpen, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhotosPage() {
  const [photos, setPhotos] = useState<EventHighlight[]>([]);
  const [allPhotos, setAllPhotos] = useState<EventHighlight[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<EventHighlight | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const fetchAlbums = useCallback(async () => {
    try {
      const response = await api.getAlbums(eventId);
      if (response.success) {
        setAlbums(response.response);
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchPeople();
      fetchAlbums();
      fetchPhotos(1);
    }
  }, [eventId, fetchPeople, fetchAlbums, fetchPhotos]);

  // Filter photos when person or album is selected/deselected
  useEffect(() => {
    let filtered = allPhotos;

    // Filter by person
    if (selectedPerson) {
      const person = people.find(p => p.groupId === selectedPerson);
      if (person) {
        filtered = filtered.filter(photo => 
          person.eventImages.includes(photo._id)
        );
      }
    }

    // Filter by album
    if (selectedAlbum) {
      filtered = filtered.filter(photo => 
        photo.album?._id === selectedAlbum
      );
    }

    setPhotos(filtered);
  }, [selectedPerson, selectedAlbum, people, allPhotos]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !selectedPerson && !selectedAlbum) {
        setPage(prev => prev + 1);
        fetchPhotos(page + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page, fetchPhotos, selectedPerson, selectedAlbum]);

  // Navigation functions
  const handlePrevPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : photos.length - 1;
      setSelectedPhoto(photos[newIndex]);
      return newIndex;
    });
  }, [photos]);

  const handleNextPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => {
      const newIndex = prev < photos.length - 1 ? prev + 1 : 0;
      setSelectedPhoto(photos[newIndex]);
      return newIndex;
    });
  }, [photos]);

  // Slideshow effect
  useEffect(() => {
    if (isPlaying && selectedPhoto) {
      const interval = setInterval(() => {
        handleNextPhoto();
      }, 3000); // Change photo every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isPlaying, selectedPhoto, handleNextPhoto]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
        setIsPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPhoto, handlePrevPhoto, handleNextPhoto]);

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Hero Header with Glassmorphic Card */}
        <div className="shrink-0 pt-20 md:pt-24 px-4 md:px-6 pb-4">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-6 md:p-8 backdrop-blur-xl border border-white/10 relative overflow-hidden"
            >
              {/* Gradient Accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl -z-10" />
              
              <div className="relative z-10">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                      Photo Gallery
                    </h1>
                    <p className="text-sm md:text-base text-white/50 mt-2">
                      {selectedPerson && selectedAlbum
                        ? `${photos.length} photos with this person in this album`
                        : selectedPerson 
                        ? `${photos.length} photos with this person`
                        : selectedAlbum
                        ? `${photos.length} photos in this album`
                        : `${photos.length} amazing moments captured`}
                    </p>
                  </div>
                  {(selectedPerson || selectedAlbum) && (
                    <div className="flex items-center gap-2">
                      {selectedPerson && (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          onClick={() => {
                            const url = `${window.location.origin}/people/${selectedPerson}`;
                            if (navigator.share) {
                              navigator.share({
                                title: 'Check out these photos!',
                                text: 'I found some great photos of this person.',
                                url: url,
                              }).catch(console.error);
                            } else {
                              navigator.clipboard.writeText(url);
                              alert('Link copied to clipboard!');
                            }
                          }}
                          className="px-4 py-2 rounded-full bg-linear-to-r from-violet-500/20 to-fuchsia-500/20 hover:from-violet-500/30 hover:to-fuchsia-500/30 text-white text-sm font-medium transition-all backdrop-blur-xl border border-white/10 flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Share Profile</span>
                        </motion.button>
                      )}
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => {
                          setSelectedPerson(null);
                          setSelectedAlbum(null);
                        }}
                        className="px-4 py-2 rounded-full bg-linear-to-r from-violet-500/20 to-fuchsia-500/20 hover:from-violet-500/30 hover:to-fuchsia-500/30 text-white text-sm font-medium transition-all backdrop-blur-xl border border-white/10"
                      >
                        ✕ <span className="hidden sm:inline">Clear All Filters</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* People Filter Pills */}
                {people.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-linear-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Find Photos By Person</span>
                    </div>
                    <div className="overflow-x-auto hide-scrollbar -mx-2 px-2">
                      <div className="flex gap-2 pb-2">
                        {/* All Photos Pill */}
                        <button
                          onClick={() => setSelectedPerson(null)}
                          className={`shrink-0 group relative transition-all duration-300 ${
                            !selectedPerson ? 'scale-100' : 'scale-95 opacity-50 hover:opacity-80'
                          }`}
                        >
                          <div className={`relative px-4 py-2 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                            !selectedPerson 
                              ? 'bg-linear-to-r from-violet-500/30 to-fuchsia-500/30 shadow-lg shadow-violet-500/20 border-2 border-violet-400/50' 
                              : 'bg-white/5 hover:bg-white/10 border-2 border-white/10'
                          }`}>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                              <span className="text-lg">🎨</span>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold text-white">All Photos</div>
                              <div className="text-xs text-white/50">{allPhotos.length} total</div>
                            </div>
                          </div>
                        </button>

                        {/* People Pills */}
                        {people.slice(0, 15).map((person, index) => (
                          <motion.button
                            key={person.groupId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => setSelectedPerson(person.groupId === selectedPerson ? null : person.groupId)}
                            className={`shrink-0 group relative transition-all duration-300 ${
                              selectedPerson === person.groupId ? 'scale-100' : 'scale-95 opacity-50 hover:opacity-80'
                            }`}
                          >
                            <div className={`relative p-1.5 rounded-full transition-all duration-300 ${
                              selectedPerson === person.groupId 
                                ? 'bg-linear-to-r from-violet-500/30 to-fuchsia-500/30 shadow-lg shadow-violet-500/20' 
                                : 'bg-white/5 hover:bg-white/10'
                            }`}>
                              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/20">
                                <Image
                                  src={person.representativeFace}
                                  alt={`Person ${index + 1}`}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 text-white/60 text-sm">?</div>`;
                                    }
                                  }}
                                />
                              </div>
                              {/* Photo Count Badge */}
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 border-2 border-background flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{person.matchCount}</span>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Albums Filter Pills */}
                {albums.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-linear-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Browse by Album</span>
                    </div>
                    <div className="overflow-x-auto hide-scrollbar -mx-2 px-2">
                      <div className="flex gap-2 pb-2">
                        {albums.map((album, index) => (
                          <motion.button
                            key={album._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => setSelectedAlbum(album._id === selectedAlbum ? null : album._id)}
                            className={`shrink-0 group relative transition-all duration-300 ${
                              selectedAlbum === album._id ? 'scale-100' : 'scale-95 opacity-50 hover:opacity-80'
                            }`}
                          >
                            <div className={`relative px-4 py-2 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                              selectedAlbum === album._id 
                                ? 'bg-linear-to-r from-violet-500/30 to-fuchsia-500/30 shadow-lg shadow-violet-500/20 border-2 border-violet-400/50' 
                                : 'bg-white/5 hover:bg-white/10 border-2 border-white/10'
                            }`}>
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                {selectedAlbum === album._id ? (
                                  <FolderOpen className="w-5 h-5 text-violet-300" />
                                ) : (
                                  <Folder className="w-5 h-5 text-violet-300" />
                                )}
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-semibold text-white">{album.name}</div>
                                <div className="text-xs text-white/50">
                                  {album.isFavourite && '⭐ '}Album
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Photo Grid - Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24">
          <div className="max-w-7xl mx-auto pt-4">
            {photos.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 md:gap-3 space-y-2 md:space-y-3"
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
                      ref={index === photos.length - 1 ? lastElementRef : null}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(index * 0.01, 0.3), duration: 0.4 }}
                      className={`group relative ${randomHeight} rounded-xl md:rounded-2xl overflow-hidden cursor-pointer break-inside-avoid mb-2 md:mb-3`}
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setSelectedPhotoIndex(index);
                        setIsPlaying(false);
                      }}
                    >
                      {/* Image */}
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm">
                        <Image
                          src={photo.thumbnail || photo.compressed}
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
            ) : !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-12 rounded-3xl text-center"
              >
                <div className="text-6xl mb-4">📸</div>
                <p className="text-white/60 text-lg">
                  {selectedPerson && selectedAlbum 
                    ? 'No photos found for this person in this album.' 
                    : selectedPerson 
                    ? 'No photos found for this person.' 
                    : selectedAlbum
                    ? 'No photos found in this album.'
                    : 'No photos available yet.'}
                </p>
              </motion.div>
            )}

            {loading && page === 1 && (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 w-12 h-12 border-2 border-fuchsia-500/20 border-t-fuchsia-400 rounded-full animate-spin animate-delay-150" />
                </div>
              </div>
            )}
          </div>
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
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedPhoto(null);
                setIsPlaying(false);
              }}
              className="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center hover:scale-110 transition-transform z-20"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPhoto();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass rounded-full flex items-center justify-center hover:scale-110 transition-all z-20 hover:bg-white/20"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass rounded-full flex items-center justify-center hover:scale-110 transition-all z-20 hover:bg-white/20"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Photo Counter and Play Button */}
            <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
              {/* Play/Pause Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="w-12 h-12 glass rounded-full flex items-center justify-center hover:scale-110 transition-transform hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>

              {/* Photo Counter */}
              <div className="px-4 py-2.5 glass rounded-full backdrop-blur-xl">
                <span className="text-sm font-semibold text-white">
                  {selectedPhotoIndex + 1} / {photos.length}
                </span>
              </div>
            </div>

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
