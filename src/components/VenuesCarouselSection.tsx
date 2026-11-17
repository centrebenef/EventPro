import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pause,
  Play,
  Star,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDH } from '../utils/pdfExport.ts';
import { TextRevealTitle } from './TextRevealTitle.tsx';
import { ParallaxImage } from './ParallaxImage.tsx';
import type { Provider } from '../types.ts';

interface VenueShowcaseSlide {
  id: string;
  providerId: string;
  name: string;
  subCategory: string;
  district: string;
  capacityMin: number;
  capacityMax: number;
  priceFrom: number;
  rating: number;
  reviewCount: number;
  shortBio: string;
  image: string;
  highlights: string[];
}

const CURATED_VENUE_SLIDES: VenueShowcaseSlide[] = [
  {
    id: 'slide_palais_anfa',
    providerId: 'prov_salle_1',
    name: "Palais d'Anfa Réceptions",
    subCategory: 'Salles de mariage',
    district: 'Anfa',
    capacityMin: 120,
    capacityMax: 550,
    priceFrom: 45000,
    rating: 4.9,
    reviewCount: 48,
    shortBio:
      'Architecture néo-mauresque en marbre de Carrare, lustres en cristal et jardins d’apparat au cœur d’Anfa Supérieur.',
    image: '/src/assets/images/venue_palais_anfa_1794908654717.jpg',
    highlights: ['2 salons modulables', 'Patio arboré', 'Voiturier 180 places'],
  },
  {
    id: 'slide_villa_californie',
    providerId: 'prov_salle_2',
    name: 'Villa Les Jardins de Californie',
    subCategory: 'Jardins et espaces extérieurs',
    district: 'Californie',
    capacityMin: 80,
    capacityMax: 350,
    priceFrom: 32000,
    rating: 4.8,
    reviewCount: 34,
    shortBio:
      'Domaine botanique de 6 000 m² avec piscine miroir éclairée et verrière contemporaine climatisée.',
    image: '/src/assets/images/carousel_villa_californie_1794910033959.jpg',
    highlights: ['Jardin paysager', 'Verrière crystal', 'Suite préparatifs'],
  },
  {
    id: 'slide_corniche_ballroom',
    providerId: 'prov_salle_3',
    name: 'Hôtel Le Corniche Grand Ballroom',
    subCategory: 'Hôtels 5 étoiles',
    district: 'Ain Diab',
    capacityMin: 150,
    capacityMax: 650,
    priceFrom: 58000,
    rating: 4.9,
    reviewCount: 52,
    shortBio:
      'Salle de bal panoramique sans piliers surplombant l’océan Atlantique au coucher du soleil.',
    image: '/src/assets/images/carousel_corniche_ballroom_1794910034169.jpg',
    highlights: ['Vue mer 180°', 'Régie audiovisuelle', 'Suite nuptiale offerte'],
  },
  {
    id: 'slide_bouskoura_pavilion',
    providerId: 'prov_salle_4',
    name: 'Domaine de Bouskoura Pavillon',
    subCategory: 'Salles de fêtes & Domaines',
    district: 'Bouskoura',
    capacityMin: 60,
    capacityMax: 320,
    priceFrom: 29000,
    rating: 4.7,
    reviewCount: 27,
    shortBio:
      'Pavillon contemporain en verre et travertin entouré de pins centenaires aux portes de Casablanca.',
    image: '/src/assets/images/carousel_bouskoura_pavilion_1794910035075.jpg',
    highlights: ['Parc boisé privé', 'Terrasse cocktail', 'Sans limite sonore'],
  },
  {
    id: 'slide_gauthier_executive',
    providerId: 'prov_salle_5',
    name: 'Espace Gauthier Business & Conférences',
    subCategory: 'Salles de conférence',
    district: 'Gauthier',
    capacityMin: 30,
    capacityMax: 220,
    priceFrom: 18000,
    rating: 4.8,
    reviewCount: 21,
    shortBio:
      'Auditorium acoustique en noyer et laiton avec mezzanine panoramique au cœur du quartier d’affaires.',
    image: '/src/assets/images/carousel_gauthier_executive_1794910035711.jpg',
    highlights: ['Visioconférence 4K', '3 salles sous-commission', 'Lounge VIP'],
  },
];

export function VenuesCarouselSection() {
  const { providers, navigate, openProviderDetail, openBookingModal } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const slides = useMemo<VenueShowcaseSlide[]>(() => {
    const salleProviders = providers.filter((p) => p.categorySlug === 'salles');
    return CURATED_VENUE_SLIDES.map((curated) => {
      const matched =
        salleProviders.find((p) => p.id === curated.providerId) ||
        salleProviders.find((p) => p.name.toLowerCase() === curated.name.toLowerCase());
      if (!matched) return curated;
      return {
        ...curated,
        providerId: matched.id,
        name: matched.name,
        subCategory: matched.subCategory || curated.subCategory,
        district: matched.district || curated.district,
        capacityMin: matched.capacityMin || curated.capacityMin,
        capacityMax: matched.capacityMax || curated.capacityMax,
        priceFrom: matched.priceFrom || curated.priceFrom,
        rating: matched.rating || curated.rating,
        reviewCount: matched.reviewCount || curated.reviewCount,
        shortBio: matched.shortBio || curated.shortBio,
      };
    });
  }, [providers]);

  const activeSlide = slides[activeIndex] || slides[0];

  const resolveProvider = useCallback(
    (slide: VenueShowcaseSlide): Provider | undefined => {
      return (
        providers.find((p) => p.id === slide.providerId) ||
        providers.find(
          (p) =>
            p.categorySlug === 'salles' &&
            p.name.toLowerCase() === slide.name.toLowerCase()
        )
      );
    },
    [providers]
  );

  const goToIndex = useCallback(
    (nextIdx: number) => {
      const total = slides.length;
      const wrapped = ((nextIdx % total) + total) % total;
      if (wrapped === activeIndex) return;
      const forwardDist = (wrapped - activeIndex + total) % total;
      const backwardDist = (activeIndex - wrapped + total) % total;
      setDirection(forwardDist <= backwardDist ? 1 : -1);
      setActiveIndex(wrapped);
    },
    [activeIndex, slides.length]
  );

  const handleNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Smooth horizontal center-align on the thumbnail strip when slide changes
  useEffect(() => {
    const thumb = thumbRefs.current[activeIndex];
    const track = trackRef.current;
    if (!thumb || !track) return;
    const trackLeft = track.getBoundingClientRect().left;
    const thumbRect = thumb.getBoundingClientRect();
    const targetScrollLeft =
      track.scrollLeft + (thumbRect.left - trackLeft) - (track.clientWidth - thumbRect.width) / 2;
    track.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  }, [activeIndex, shouldReduceMotion]);

  // Gentle auto-advance paused on hover or manual toggle
  useEffect(() => {
    if (!isAutoPlaying || isHovered || shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, isHovered, shouldReduceMotion, slides.length]);

  const activeProvider = resolveProvider(activeSlide);

  return (
    <section
      aria-label="Carrousel des salles de réception à Casablanca"
      className="bg-[#151515] text-white py-20 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#C9A45C] block">
              Adresses Signature
            </span>
            <TextRevealTitle
              as="h2"
              surface="dark"
              text="Salles de réception d’exception à Casablanca"
              className="font-display text-3xl sm:text-4xl font-semibold text-white"
            />
            <p className="text-sm text-white/70 leading-relaxed">
              Palais d&apos;apparat, villas avec jardins, hôtels face à l&apos;océan et espaces
              confidentiels prêts à accueillir vos plus beaux moments.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              aria-label={isAutoPlaying ? 'Mettre le carrousel en pause' : 'Reprendre le carrousel'}
              className="w-10 h-10 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:border-[#C9A45C] hover:text-[#C9A45C] transition-colors flex items-center justify-center shrink-0"
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Salle précédente"
              className="w-10 h-10 rounded-lg border border-white/15 bg-white/5 text-white hover:border-[#C9A45C] hover:bg-[#C9A45C] hover:text-[#151515] transition-colors flex items-center justify-center shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Salle suivante"
              className="w-10 h-10 rounded-lg border border-white/15 bg-white/5 text-white hover:border-[#C9A45C] hover:bg-[#C9A45C] hover:text-[#151515] transition-colors flex items-center justify-center shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('salles')}
              className="hidden sm:inline-flex items-center gap-1.5 pl-2 text-xs font-semibold text-[#C9A45C] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Toutes les salles
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Large Architectural Stage */}
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
          }}
          className="relative h-[460px] sm:h-[520px] lg:h-[560px] rounded-2xl overflow-hidden border border-white/10 bg-[#1D1D1D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C]"
        >
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.div
              key={activeSlide.id}
              custom={direction}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction > 0 ? 56 : -56, scale: 1.03 }
              }
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction > 0 ? -56 : 56, scale: 0.99 }
              }
              transition={{
                duration: shouldReduceMotion ? 0.2 : 0.65,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0"
            >
              {failedImages[activeSlide.id] ? (
                <div className="w-full h-full bg-gradient-to-br from-[#1D1D1D] via-[#262118] to-[#151515] flex flex-col items-center justify-center p-8 text-center">
                  <span className="font-display text-3xl text-[#C9A45C]">{activeSlide.name}</span>
                  <span className="text-sm text-white/60 mt-2">{activeSlide.district}, Casablanca</span>
                </div>
              ) : (
                <ParallaxImage
                  src={activeSlide.image}
                  alt={activeSlide.name}
                  intensity={24}
                  wrapperClassName="w-full h-full"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [activeSlide.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              )}

              {/* Measured Multi-Stop Scrim for High Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Top-right Numerical Slide Index */}
          <div className="absolute top-5 right-5 z-10 flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-black/55 backdrop-blur-sm border border-white/15">
            <span className="font-mono text-xs font-semibold text-[#C9A45C] tabular-nums">
              {String(activeIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-white/35 text-xs">/</span>
            <span className="font-mono text-xs text-white/70 tabular-nums">
              {String(slides.length).padStart(2, '0')}
            </span>
          </div>

          {/* Foreground Editorial Content Overlay */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
              >
                <div className="max-w-2xl space-y-3">
                  {/* Unboxed Metadata */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#C9A45C]">
                    <span>{activeSlide.subCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {activeSlide.district}, Casablanca
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="w-3.5 h-3.5" />
                      {activeSlide.capacityMin} – {activeSlide.capacityMax} invités
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums text-white/90">
                      <Star className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                      {activeSlide.rating.toFixed(1)} ({activeSlide.reviewCount} avis)
                    </span>
                  </div>

                  <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">
                    {activeSlide.name}
                  </h3>

                  <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                    {activeSlide.shortBio}
                  </p>

                  {/* Quiet inline highlights */}
                  <p className="text-xs text-white/60">
                    {activeSlide.highlights.join('  ·  ')}
                  </p>
                </div>

                {/* Pricing + Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4 shrink-0">
                  <div className="lg:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-white/60 block">
                      À partir de
                    </span>
                    <span className="font-display text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                      {formatDH(activeSlide.priceFrom)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeProvider) {
                          openProviderDetail(activeProvider);
                        } else {
                          navigate('salles');
                        }
                      }}
                      className="px-5 py-2.5 rounded-lg bg-white/10 border border-white/25 text-white text-xs font-semibold hover:bg-white hover:text-[#151515] transition-colors whitespace-nowrap shrink-0"
                    >
                      Voir la salle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeProvider) {
                          openBookingModal(activeProvider);
                        } else {
                          navigate('salles');
                        }
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#C9A45C] text-[#151515] text-xs font-semibold hover:bg-white transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      Réserver
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Horizontal Scrollable Thumbnail Strip */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={slide.id}
                ref={(el) => {
                  thumbRefs.current[idx] = el;
                }}
                type="button"
                onClick={() => goToIndex(idx)}
                aria-current={isSelected ? 'true' : undefined}
                className={`group snap-start shrink-0 w-[250px] sm:w-[270px] lg:flex-1 lg:min-w-[210px] text-left rounded-xl overflow-hidden border transition-all duration-300 ${
                  isSelected
                    ? 'border-[#C9A45C] bg-white/10'
                    : 'border-white/10 bg-white/[0.03] opacity-75 hover:opacity-100 hover:border-white/30'
                }`}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1D1D1D]">
                  {failedImages[slide.id] ? (
                    <div className="w-full h-full bg-[#242424]" />
                  ) : (
                    <img
                      src={slide.image}
                      alt={slide.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [slide.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div
                    className={`h-0.5 absolute top-0 inset-x-0 transition-opacity duration-300 ${
                      isSelected ? 'bg-[#C9A45C] opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
                <div className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#C9A45C]">
                    <span className="truncate">{slide.district}</span>
                    <span className="font-mono tabular-nums text-white/60 shrink-0">
                      {slide.capacityMax} pers.
                    </span>
                  </div>
                  <p className="font-display text-base font-semibold text-white truncate">
                    {slide.name}
                  </p>
                  <p className="text-[11px] text-white/60 tabular-nums">
                    Dès {formatDH(slide.priceFrom)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile link to full catalog */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => navigate('salles')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A45C]"
          >
            Voir toutes les salles de réception
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
