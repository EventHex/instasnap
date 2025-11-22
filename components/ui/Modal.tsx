'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={cn(
                    "relative w-full max-w-lg transform rounded-2xl bg-card p-6 text-left shadow-xl transition-all animate-scale-in border border-border/50 glass",
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="absolute right-4 top-4">
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <span className="sr-only">Close</span>
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {title && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold leading-none tracking-tight">
                            {title}
                        </h3>
                    </div>
                )}

                <div className="mt-2">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
