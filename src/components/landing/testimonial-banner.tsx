"use client";

import { ArrowLeft, ArrowRight, CheckCircle, Quote, Shield, Star } from 'lucide-react';
import Image from 'next/image';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  avatar: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    name: 'Mikael',
    role: 'Helsinki',
    quote: 'Nopea apu muuttoon – suosittelen! Palvelu oli erinomainen ja tekijä hyvin ammattitaitoinen.',
    avatar: '/images/testmonials/mikael.jpg',
    rating: 5,
  },
  {
    name: 'Maria',
    role: 'Turku',
    quote: 'Paras tapa löytää luotettava tekijä. Säästin aikaa ja vaivaa merkittävästi.',
    avatar: '/images/testmonials/maria.png',
    rating: 5,
  },
  {
    name: 'Leena',
    role: 'Espoo',
    quote: 'Arki helpottui – viiden tähden palvelu. En voisi olla tyytyväisempi lopputulokseen.',
    avatar: '/images/testmonials/leena.jpg',
    rating: 5,
  },
  {
    name: 'John',
    role: 'Tampere',
    quote: 'Työ sovittiin nopeasti ja sujui hienosti. Tekijä oli täsmällinen ja ystävällinen.',
    avatar: '/images/testmonials/lady.jpg',
    rating: 5,
  },
];

function Stars({ rating = 5, size = "sm" }: { rating?: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={`${sizeClasses[size]} ${
            i < rating 
              ? "fill-amber-400 text-amber-400" 
              : "fill-gray-200 text-gray-200"
          }`} 
        />
      ))}
    </div>
  );
}

export default function TestimonialBanner() {
  const listRef = useRef<HTMLUListElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);
  const autoplayTimerRef = useRef<number | null>(null);
  const resumePauseTimeoutRef = useRef<number | null>(null);

  const getStep = useCallback(() => {
    const root = listRef.current;
    if (!root) return 400;
    const firstCard = root.querySelector('li');
    const cardWidth = (firstCard as HTMLElement | null)?.clientWidth ?? 400;
    return cardWidth;
  }, []);

  const scrollByOne = useCallback((direction: 'prev' | 'next') => {
    const root = listRef.current;
    if (!root) return;

    const step = getStep();
    const delta = step * (direction === 'next' ? 1 : -1);
    const targetLeft = root.scrollLeft + delta;
    const maxLeft = root.scrollWidth - root.clientWidth;

    let newIndex = currentIndex;
    
    if (direction === 'next') {
      if (targetLeft >= maxLeft - 2) {
        root.scrollTo({ left: 0, behavior: 'smooth' });
        newIndex = 0;
      } else {
        root.scrollBy({ left: delta, behavior: 'smooth' });
        newIndex = Math.min(currentIndex + 1, testimonials.length - 1);
      }
    } else {
      if (targetLeft <= 0) {
        root.scrollTo({ left: maxLeft, behavior: 'smooth' });
        newIndex = testimonials.length - 1;
      } else {
        root.scrollBy({ left: delta, behavior: 'smooth' });
        newIndex = Math.max(currentIndex - 1, 0);
      }
    }
    
    setCurrentIndex(newIndex);
  }, [getStep, currentIndex]);

  // Autoplay with hover/focus pause
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    if (isPaused) {
      if (autoplayTimerRef.current !== null) {
        window.clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      return;
    }

    const intervalId = window.setInterval(() => {
      scrollByOne('next');
    }, 4000);
    autoplayTimerRef.current = intervalId;

    return () => {
      if (autoplayTimerRef.current !== null) {
        window.clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [isPaused, scrollByOne]);

  // Cleanup any pending resume timers on unmount
  useEffect(() => {
    return () => {
      if (resumePauseTimeoutRef.current !== null) {
        window.clearTimeout(resumePauseTimeoutRef.current);
      }
    };
  }, []);

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLUListElement>) => {
    const root = listRef.current;
    if (!root) return;
    if (e.pointerType !== 'mouse') {
      setIsPaused(true);
      return;
    }
    root.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = root.scrollLeft;
    setIsPaused(true);
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLUListElement>) => {
    if (!isDragging) return;
    const root = listRef.current;
    if (!root) return;
    const dx = e.clientX - dragStartXRef.current;
    const nextLeft = dragStartScrollLeftRef.current - dx;
    const maxLeft = root.scrollWidth - root.clientWidth;
    root.scrollLeft = Math.max(0, Math.min(maxLeft, nextLeft));
  }, [isDragging]);

  const endDragAndMaybeResume = useCallback((e?: ReactPointerEvent<HTMLUListElement>) => {
    if (isDragging) {
      setIsDragging(false);
      const root = listRef.current;
      if (root) {
        try {
          if (e) root.releasePointerCapture?.(e.pointerId);
        } catch (_) {
          // ignore
        }
      }
    }
    if (resumePauseTimeoutRef.current !== null) {
      window.clearTimeout(resumePauseTimeoutRef.current);
    }
    resumePauseTimeoutRef.current = window.setTimeout(() => setIsPaused(false), 1500);
  }, [isDragging]);

  const handleKeyDown = useCallback((e: ReactKeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setIsPaused(true);
      scrollByOne('next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setIsPaused(true);
      scrollByOne('prev');
    }
  }, [scrollByOne]);

  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-6">
            <CheckCircle className="w-4 h-4" />
            Tyytyväiset asiakkaat
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Kumppanimme <span className="text-primary">kiittävät</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tuhannet tyytyväiset asiakkaat luottavat palveluumme päivittäin
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Overall Rating */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">4.8</div>
            <div className="flex justify-center mb-3">
              <Stars rating={5} size="md" />
            </div>
            <div className="text-sm font-semibold text-gray-900 mb-1">500+ arvostelua</div>
            <div className="text-xs text-gray-500">G2, Capterra ja Trustpilot</div>
          </div>

          {/* Trust Indicators */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-gray-900">Turvallinen</div>
                <div className="text-sm text-gray-600">100% suojattu</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-700">Luotettu kumppani</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-700">Vakuutetut tekijät</span>
              </div>
            </div>
          </div>

          {/* Payment Security */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Image 
                src="/images/hero/paytrail.png" 
                alt="Paytrail" 
                width={120} 
                height={40} 
                className="h-8 w-auto" 
              />
            </div>
            <div className="text-sm text-gray-700 mb-2">Suomen johtava maksuratkaisu</div>
            <div className="text-xs text-gray-500">Turvallinen ja nopea maksaminen</div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <div className="hidden md:flex items-center justify-center gap-4 mb-8">
            <button
              aria-label="Edellinen testimoniali"
              onClick={(e) => {
                e.preventDefault();
                setIsPaused(true);
                scrollByOne('prev');
              }}
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
            </button>
            
            {/* Dots Indicator */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const root = listRef.current;
                    if (root) {
                      const step = getStep();
                      root.scrollTo({ left: step * index, behavior: 'smooth' });
                      setCurrentIndex(index);
                      setIsPaused(true);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex % testimonials.length
                      ? 'bg-primary w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Siirry testimoniaaliin ${index + 1}`}
                />
              ))}
            </div>

            <button
              aria-label="Seuraava testimoniali"
              onClick={(e) => {
                e.preventDefault();
                setIsPaused(true);
                scrollByOne('next');
              }}
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
              type="button"
            >
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Testimonial Cards */}
          <ul
            ref={listRef}
            role="list"
            aria-label="Asiakastestimoniaalit"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDragAndMaybeResume}
            onPointerLeave={endDragAndMaybeResume}
            className={`flex overflow-x-auto snap-x snap-mandatory scroll-smooth 
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] 
              select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <li
                key={`${testimonial.name}-${index}`}
                className="w-full max-w-md flex-shrink-0 snap-start px-4"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full relative">
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 opacity-10">
                    <Quote className="w-12 h-12 text-primary" />
                  </div>
                  
                  {/* Stars */}
                  <div className="mb-4">
                    <Stars rating={testimonial.rating} size="sm" />
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="mb-6">
                    <p className="text-gray-700 text-lg leading-relaxed font-medium">
                      "{testimonial.quote}"
                    </p>
                  </blockquote>
                  
                  {/* Author Info */}
                  <div className="flex items-center">
                    <div className="relative">
                      <Image
                        src={testimonial.avatar}
                        alt={`${testimonial.name}:n kuva`}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Mobile Navigation Controls */}
          <div className="md:hidden flex justify-center gap-4 mt-8">
            <button
              aria-label="Edellinen testimoniali"
              onClick={(e) => {
                e.preventDefault();
                setIsPaused(true);
                scrollByOne('prev');
              }}
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Mobile Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex % testimonials.length
                      ? 'bg-primary w-6'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              aria-label="Seuraava testimoniali"
              onClick={(e) => {
                e.preventDefault();
                setIsPaused(true);
                scrollByOne('next');
              }}
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              type="button"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
