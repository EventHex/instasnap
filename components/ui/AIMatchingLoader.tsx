'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Scan, Brain, Image as ImageIcon, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AIMatchingLoaderProps {
  show: boolean;
  onComplete?: () => void;
}

const matchingSteps = [
  { icon: Scan, text: 'Scanning your face...', duration: 1500 },
  { icon: Brain, text: 'Analyzing facial features...', duration: 2000 },
  { icon: Sparkles, text: 'Running AI face matching...', duration: 2500 },
  { icon: ImageIcon, text: 'Searching photo gallery...', duration: 2000 },
  { icon: Check, text: 'Found your photos!', duration: 1000 },
];

export function AIMatchingLoader({ show, onComplete }: AIMatchingLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Progress through steps
  useEffect(() => {
    if (!show) {
      // Reset when hidden
      setTimeout(() => setCurrentStep(0), 300);
      return;
    }

    if (currentStep >= matchingSteps.length) return;

    const timer = setTimeout(() => {
      if (currentStep < matchingSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        onComplete?.();
      }
    }, matchingSteps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [show, currentStep, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <div className="relative">
            {/* Animated background glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl"
            />

            {/* Main content */}
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative bg-[#1c1c1e]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-12 shadow-2xl ring-1 ring-white/5"
            >
              {/* Icon container */}
              <div className="flex flex-col items-center space-y-8">
                <div className="relative w-32 h-32">
                  {/* Rotating ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-blue-500"
                  />

                  {/* Icon */}
                  <motion.div
                    key={currentStep}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {(() => {
                      const Icon = matchingSteps[currentStep].icon;
                      return (
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                      );
                    })()}
                  </motion.div>
                </div>

                {/* Progress text */}
                <div className="text-center min-h-[60px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xl font-semibold text-white tracking-tight"
                    >
                      {matchingSteps[currentStep].text}
                    </motion.p>
                  </AnimatePresence>

                  {/* Progress dots */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {matchingSteps.map((_, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.8 }}
                        animate={{
                          scale: index === currentStep ? 1.2 : 0.8,
                          backgroundColor: index <= currentStep ? '#a855f7' : '#4b5563',
                        }}
                        className="w-2 h-2 rounded-full"
                      />
                    ))}
                  </div>
                </div>

                {/* Scanning line animation */}
                <motion.div
                  animate={{ scaleX: [0, 1, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-48 h-1 bg-linear-to-r from-transparent via-purple-500 to-transparent rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
