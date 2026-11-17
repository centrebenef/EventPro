import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Quote,
  Star,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { TextRevealTitle } from './TextRevealTitle.tsx';
import type { TestimonialItem } from '../types.ts';

type StoryFilter = 'all' | 'mariage' | 'prive' | 'corporate';

interface LoveStoryCard {
  id: string;
  author: string;
  initials: string;
  role: string;
  eventType: string;
  district: string;
  guests: number;
  rating: number;
  comment: string;
  outcome: string;
  image: string;
  filterGroup: Exclude<StoryFilter, 'all'>;
}

const STORY_ENRICHMENTS: Record<
  string,
  Pick<LoveStoryCard, 'district' | 'guests' | 'outcome' | 'image' | 'filterGroup'>
> = {
  t1: {
    district: 'Anfa',
    guests: 300,
    outcome: 'Salle, traiteur et photographe réservés en 48h',
    image: '/src/assets/images/masonry_wedding_ceremony_1794909781544.jpg',
    filterGroup: 'mariage',
  },
  t2: {
    district: 'Gauthier',
    guests: 220,
    outcome: 'Devis PDF validé et zéro dépassement budgétaire',
    image: '/src/assets/images/masonry_corporate_conference_1794909784522.jpg',
    filterGroup: 'corporate',
  },
  t3: {
    district: 'Californie',
    guests: 140,
    outcome: 'Coordination complète suivie depuis l’espace client',
    image: '/src/assets/images/carousel_villa_californie_1794910033959.jpg',
    filterGroup: 'prive',
  },
};

const EXTRA_LOVE_STORIES: LoveStoryCard[] = [
  {
    id: 'story-ain-diab',
    author: 'Nadia & Mehdi Tazi',
    initials: 'NT',
    role: 'Mariage face à l’Atlantique · Hôtel Le Corniche',
    eventType: 'Mariage',
    district: 'Ain Diab',
    guests: 420,
    rating: 5,
    comment:
      'La vue sur le coucher du soleil, la scénographie florale et l’orchestre andalou ont émerveillé nos 420 invités venus de Rabat et Paris. Tout était millimétré.',
    outcome: '5 prestataires coordonnés sans aucune fausse note',
    image: '/src/assets/images/carousel_corniche_ballroom_1794910034169.jpg',
    filterGroup: 'mariage',
  },
  {
    id: 'story-bouskoura',
    author: 'Inès & Amine Berrada',
    initials: 'IB',
    role: 'Anniversaire & Cocktail Lounge · Domaine de Bouskoura',
    eventType: 'Soirée privée',
    district: 'Bouskoura',
    guests: 160,
    rating: 5,
    comment:
      'L’assistant EVENT AI nous a aidés à équilibrer notre budget entre le pavillon forestier, le traiteur gastronomique et le DJ. Une soirée inoubliable sous les pins.',
    outcome: 'Budget optimisé de 15 % grâce aux offres exclusives',
    image: '/src/assets/images/carousel_bouskoura_pavilion_1794910035075.jpg',
    filterGroup: 'prive',
  },
  {
    id: 'story-oasis',
    author: 'Kenza Lahlou',
    initials: 'KL',
    role: 'Directrice Communication · Casablanca Finance City',
    eventType: 'Gala annuel',
    district: 'Oasis',
    guests: 260,
    rating: 5,
    comment:
      'Pour notre dîner de gala annuel, la sélection d’EVENT PRO nous a fait gagner trois semaines de prospection. Scénographie raffinée et service traiteur irréprochable.',
    outcome: 'Taux de satisfaction interne de 98 % auprès des invités',
    image: '/src/assets/images/masonry_soiree_cocktail_1794909783107.jpg',
    filterGroup: 'corporate',
  },
];

const STORY_FILTERS: { id: StoryFilter; label: string }[] = [
  { id: 'all', label: 'Toutes les histoires' },
  { id: 'mariage', label: 'Mariages' },
  { id: 'prive', label: 'Réceptions privées' },
  { id: 'corporate', label: 'Événements Pro' },
];

const AUTO_ADVANCE_MS = 5600;

function getInitials(name: string): string {
  const parts = name
    .replace(/&/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'EP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function inferFilterGroup(eventType: string): Exclude<StoryFilter, 'all'> {
  const lower = eventType.toLowerCase();
  if (lower.includes('mariage')) return 'mariage';
  if (lower.includes('conf') || lower.includes('gala') || lower.includes('pro')) {
    return 'corporate';
  }
  return 'prive';
}

export function ClientLoveStoriesSection() {
  const { siteContent, navigate } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const [filter, setFilter] = useState<StoryFilter>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPausedByHover, setIsPausedByHover] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const stories = useMemo<LoveStoryCard[]>(() => {
    const dbTestimonials: TestimonialItem[] = siteContent?.testimonials || [];
    const enrichedDbStories: LoveStoryCard[] = dbTestimonials.map((t, idx) => {
      const enrich = STORY_ENRICHMENTS[t.id] || {
        district: 'Casablanca',
        guests: 180,
        outcome: 'Accompagnement personnalisé EVENT PRO',
        image:
          idx % 2 === 0
            ? '/src/assets/images/photo_couple_editorial_1794908655309.jpg'
            : '/src/assets/images/decor_floral_luxury_1794908655561.jpg',
        filterGroup: inferFilterGroup(t.eventType),
      };
      return {
        id: t.id,
        author: t.author,
        initials: getInitials(t.author),
        role: t.role,
        eventType: t.eventType,
        district: enrich.district,
        guests: enrich.guests,
        rating: t.rating,
        comment: t.comment,
        outcome: enrich.outcome,
        image: enrich.image,
        filterGroup: enrich.filterGroup,
      };
    });

    return [...enrichedDbStories, ...EXTRA_LOVE_STORIES];
  }, [siteContent?.testimonials]);

  const visibleStories = useMemo(() => {
    if (filter === 'all') return stories;
    return stories.filter((s) => s.filterGroup === filter);
  }, [filter, stories]);

  const safeIndex = visibleStories.length > 0 ? activeIndex % visibleStories.length : 0;
  const activeStory = visibleStories[safeIndex] || null;

  // Reset index cleanly when changing category filter
  const handleSelectFilter = (nextFilter: StoryFilter) => {
    setFilter(nextFilter);
    setDirection(1);
    setActiveIndex(0);
  };

  // Automatic carousel progression
  useEffect(() => {
    if (
      shouldReduceMotion ||
      !isAutoPlaying ||
      isPausedByHover ||
      visibleStories.length <= 1
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % visibleStories.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [isAutoPlaying, isPausedByHover, shouldReduceMotion, visibleStories.length]);

  const goPrev = () => {
    if (visibleStories.length <= 1) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + visibleStories.length) % visibleStories.length);
  };

  const goNext = () => {
    if (visibleStories.length <= 1) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % visibleStories.length);
  };

  const goTo = (index: number) => {
    if (index === safeIndex) return;
    setDirection(index > safeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  return (
    <section
      aria-label="Client Love Stories — Carrousel de témoignages clients"
      onMouseEnter={() => setIsPausedByHover(true)}
      onMouseLeave={() => setIsPausedByHover(false)}
      onFocusCapture={() => setIsPausedByHover(true)}
      onBlurCapture={() => setIsPausedByHover(false)}
      className="bg-white border-y border-[#151515]/10 py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#A8843E] block">
              Client Love Stories
            </span>
            <TextRevealTitle
              as="h2"
              surface="light"
              text="Ils ont célébré leurs moments d’exception avec EVENT PRO"
              className="font-display text-3xl sm:text-4xl font-semibold text-[#151515]"
            />
            <p className="text-sm text-[#777777] leading-relaxed tabular-nums">
              Note moyenne vérifiée de <strong className="text-[#151515]">4,9 / 5</strong> auprès de couples et directions d&apos;entreprise à Casablanca.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filtrer les témoignages par type d'événement"
            className="flex flex-wrap items-center gap-2"
          >
            {STORY_FILTERS.map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#151515] text-[#C9A45C]'
                      : 'bg-[#F7F4EF] text-[#151515]/80 border border-[#151515]/10 hover:border-[#C9A45C] hover:text-[#151515]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Animated Carousel Stage */}
        {activeStory && (
          <div className="space-y-6">
            <div className="relative rounded-2xl bg-[#F7F4EF] border border-[#151515]/10 overflow-hidden shadow-sm">
              {/* Subtle Edge Fade Masks for Polished Carousel Feeling */}
              <div
                aria-hidden="true"
                className="pointer-events-none hidden lg:block absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#F7F4EF]/80 to-transparent z-10"
              />

              <AnimatePresence mode="wait" custom={direction}>
                <motion.article
                  key={activeStory.id}
                  custom={direction}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: direction > 0 ? 32 : -32 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: direction > 0 ? -32 : 32 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0.15 : 0.48,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[380px]"
                >
                  {/* Left: Editorial Memory Photo with Fade Veil */}
                  <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full overflow-hidden bg-[#1D1D1D]">
                    {failedImages[activeStory.id] ? (
                      <div className="w-full h-full bg-gradient-to-br from-[#1D1D1D] to-[#262118] flex items-center justify-center p-8">
                        <span className="font-display text-2xl text-[#C9A45C]">
                          {activeStory.author}
                        </span>
                      </div>
                    ) : (
                      <motion.img
                        src={activeStory.image}
                        alt={`${activeStory.eventType} — ${activeStory.author}`}
                        referrerPolicy="no-referrer"
                        initial={shouldReduceMotion ? false : { opacity: 0.75, scale: 1.06 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [activeStory.id]: true,
                          }))
                        }
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div
                      aria-hidden="true"
                      className="hidden lg:block absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F7F4EF]/25 to-transparent"
                    />
                    <div className="absolute bottom-5 left-5 right-5 space-y-1 text-white">
                      <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#C9A45C] block">
                        {activeStory.eventType}
                      </span>
                      <p className="text-xs text-white/85 tabular-nums">
                        {activeStory.district}, Casablanca · {activeStory.guests} invités
                      </p>
                    </div>
                  </div>

                  {/* Right: Animated Stars, Quote & Author Signature */}
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-8">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between gap-4">
                        {/* Animated Gold Stars */}
                        <div
                          className="flex items-center gap-1.5"
                          aria-label={`Note de ${activeStory.rating} sur 5`}
                        >
                          {Array.from({ length: activeStory.rating }).map((_, starIdx) => (
                            <motion.span
                              key={`${activeStory.id}-star-${starIdx}`}
                              initial={
                                shouldReduceMotion
                                  ? false
                                  : { opacity: 0, scale: 0.35, rotate: -18 }
                              }
                              animate={
                                shouldReduceMotion
                                  ? undefined
                                  : {
                                      opacity: 1,
                                      scale: [0.35, 1.22, 1],
                                      rotate: 0,
                                    }
                              }
                              transition={{
                                duration: 0.45,
                                delay: shouldReduceMotion ? 0 : 0.12 + starIdx * 0.08,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="inline-flex"
                            >
                              <Star className="w-4 h-4 text-[#C9A45C] fill-[#C9A45C] drop-shadow-[0_0_6px_rgba(201,164,92,0.45)]" />
                            </motion.span>
                          ))}
                          <span className="ml-2 text-xs font-mono font-semibold text-[#151515] tabular-nums">
                            {activeStory.rating.toFixed(1)} / 5
                          </span>
                        </div>

                        <Quote className="w-7 h-7 text-[#C9A45C]/65 shrink-0" />
                      </div>

                      <blockquote className="font-display text-2xl sm:text-3xl font-medium text-[#151515] leading-[1.35] italic">
                        &ldquo;{activeStory.comment}&rdquo;
                      </blockquote>
                    </div>

                    {/* Author Signature + Carousel Arrows */}
                    <div className="pt-6 border-t border-[#151515]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#151515] border border-[#C9A45C]/70 text-[#C9A45C] font-display text-base font-semibold flex items-center justify-center shrink-0">
                          {activeStory.initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-[#151515] truncate">
                            {activeStory.author}
                          </h3>
                          <p className="text-xs text-[#777777] truncate">{activeStory.role}</p>
                          <p className="text-xs font-medium text-[#A8843E] truncate mt-0.5">
                            {activeStory.outcome}
                          </p>
                        </div>
                      </div>

                      {visibleStories.length > 1 && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsAutoPlaying((prev) => !prev)}
                            aria-label={
                              isAutoPlaying
                                ? 'Mettre en pause le défilement automatique'
                                : 'Reprendre le défilement automatique'
                            }
                            className="w-9 h-9 rounded-lg bg-white border border-[#151515]/15 text-[#151515]/75 hover:border-[#C9A45C] hover:text-[#151515] flex items-center justify-center transition-colors shrink-0"
                          >
                            {isAutoPlaying ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={goPrev}
                            aria-label="Témoignage précédent"
                            className="w-9 h-9 rounded-lg bg-white border border-[#151515]/15 text-[#151515] hover:bg-[#151515] hover:text-white flex items-center justify-center transition-colors shrink-0"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={goNext}
                            aria-label="Témoignage suivant"
                            className="w-9 h-9 rounded-lg bg-[#151515] text-white hover:bg-[#C9A45C] hover:text-[#151515] flex items-center justify-center transition-colors shrink-0"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>

              {/* Subtle Auto-Advance Gold Progress Line */}
              {visibleStories.length > 1 &&
                isAutoPlaying &&
                !isPausedByHover &&
                !shouldReduceMotion && (
                  <div
                    aria-hidden="true"
                    className="h-[2px] w-full bg-[#151515]/5 overflow-hidden"
                  >
                    <motion.div
                      key={`${activeStory.id}-progress`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: AUTO_ADVANCE_MS / 1000,
                        ease: 'linear',
                      }}
                      className="h-full w-full origin-left bg-gradient-to-r from-[#A8843E] via-[#C9A45C] to-[#E6C782]"
                    />
                  </div>
                )}
            </div>

            {/* Quick-Jump Story Thumbnails & Pagination Strip */}
            {visibleStories.length > 1 && (
              <div className="relative">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {visibleStories.map((story, idx) => {
                    const isCurrent = idx === safeIndex;
                    return (
                      <button
                        key={story.id}
                        type="button"
                        onClick={() => goTo(idx)}
                        aria-current={isCurrent ? 'true' : undefined}
                        className={`text-left p-3 rounded-xl border transition-all duration-300 ${
                          isCurrent
                            ? 'bg-[#151515] text-white border-[#C9A45C] shadow-md'
                            : 'bg-[#F7F4EF] text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]/60 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider truncate ${
                              isCurrent ? 'text-[#C9A45C]' : 'text-[#A8843E]'
                            }`}
                          >
                            {story.district}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono tabular-nums shrink-0">
                            <Star className="w-2.5 h-2.5 text-[#C9A45C] fill-[#C9A45C]" />
                            {story.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold truncate">{story.author}</p>
                        <p
                          className={`text-[11px] truncate ${
                            isCurrent ? 'text-white/70' : 'text-[#777777]'
                          }`}
                        >
                          {story.eventType}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#151515]/10">
          <p className="text-xs text-[#777777]">
            Prêt à écrire votre propre histoire à Casablanca ?
          </p>
          <button
            type="button"
            onClick={() => navigate('event-builder')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#151515] hover:text-[#A8843E] transition-colors whitespace-nowrap shrink-0"
          >
            Commencer votre projet dans l&apos;Event Builder
            <ArrowRight className="w-3.5 h-3.5 text-[#C9A45C]" />
          </button>
        </div>
      </div>
    </section>
  );
}
