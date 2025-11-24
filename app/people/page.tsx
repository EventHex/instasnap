'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Person } from '@/lib/types';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { Users, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await api.getPeople(eventId);
        console.log('[People] API Response:', response);
        if (response.success) {
          console.log('[People] People data:', response.people);
          setPeople(response.people);
        }
      } catch (error) {
        console.error('Failed to fetch people:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPeople();
    }
  }, [eventId]);

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24">

          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 md:p-8 backdrop-blur-xl border border-white/10 relative overflow-hidden mb-8 mt-20 md:mt-24"
          >
            {/* Gradient Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl -z-10" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center ring-1 ring-white/20">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                    People
                  </h1>
                </div>
                <p className="text-sm md:text-base text-white/50 ml-15">
                  {loading ? 'Detecting faces...' : `${people.length} ${people.length === 1 ? 'person' : 'people'} found in your photos`}
                </p>
              </div>
              {!loading && people.length > 0 && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <ImageIcon className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/60">Click to view all photos</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-fuchsia-500/20 border-t-fuchsia-400 rounded-full animate-spin animate-delay-150" />
              </div>
            </div>
          )}

          {/* People Grid - Masonry Layout */}
          {!loading && people.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-4 space-y-3 md:space-y-4 mt-8"
            >
              {people.map((person, index) => {
                // Varying heights for masonry effect
                const heights = ['h-64', 'h-72', 'h-80', 'h-56', 'h-68', 'h-60'];
                const height = heights[index % heights.length];
                
                return (
                  <motion.div
                    key={person.groupId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.4), duration: 0.4 }}
                    className="break-inside-avoid mb-3 md:mb-4"
                  >
                    <Link href={`/people/${person.groupId}`}>
                      <div className={`group relative ${height} rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer`}>
                        {/* Image Container */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm">
                          <Image
                            src={person.representativeFace}
                            alt={`Person ${index + 1}`}
                            fill
                            className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-linear-to-br from-violet-500/20 to-fuchsia-500/20"><span class="text-white/40 text-4xl">?</span></div>`;
                              }
                            }}
                          />
                        </div>
                        
                        {/* Gradient Overlay - Always Visible */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                        
                        {/* Photo Count Badge */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                              <ImageIcon className="w-3.5 h-3.5 text-white" />
                              <span className="text-sm font-semibold text-white">
                                {person.matchCount}
                              </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 px-3 py-1.5 bg-violet-500/20 backdrop-blur-xl rounded-full border border-violet-400/30">
                              <span className="text-xs font-medium text-white">View Photos</span>
                            </div>
                          </div>
                        </div>

                        {/* Hover Ring */}
                        <div className="absolute inset-0 rounded-2xl md:rounded-3xl ring-1 ring-white/10 group-hover:ring-violet-400/50 transition-all duration-300" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && people.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white/5 text-5xl mb-6 shadow-inner ring-1 ring-white/10">
                <Users className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No People Detected</h3>
              <p className="text-white/60">Check back later as more photos are uploaded.</p>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}
