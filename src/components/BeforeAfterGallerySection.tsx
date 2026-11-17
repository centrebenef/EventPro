import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Eye, MoveHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { TextRevealTitle } from './TextRevealTitle.tsx';

interface BeforeAfterCase {
  id: string;
  title: string;
  venueName: string;
  district: string;
  guests: number;
  decoratorName: string;
  summary: string;
  beforeImage: string;
  afterImage: string;
  beforeNote: string;
  afterNote: string;
  highlights: string[];
}

const BEFORE_AFTER_CASES: BeforeAfterCase[] = [
  {
    id: 'ba-palais-anfa',
    title: "Grand Salon Royal — Palais d'Anfa",
    venueName: "Palais d'Anfa Réceptions",
    district: 'Anfa',
    guests: 450,
    decoratorName: 'Atelier Floralia Californie',
    summary:
      'Métamorphose complète d’une salle en marbre et stuc néo-mauresque grâce à un plafond floral suspendu de roses blanches et d’orchidées, trois lustres monumentaux et des tables dressées à l’or fin.',
    beforeImage: '/src/assets/images/before_palais_anfa_1794913954090.jpg',
    afterImage: '/src/assets/images/after_palais_anfa_1794913953405.jpg',
    beforeNote: 'Salle vide · Architecture brute',
    afterNote: 'Après décoration · Mariage Royal',
    highlights: ['Plafond floral 18 m', '45 tables en lin ivoire', 'Éclairage architectural chaud'],
  },
  {
    id: 'ba-villa-verriere',
    title: 'La Verrière & Terrasse — Villa Californie',
    venueName: 'Villa Les Jardins de Californie',
    district: 'Californie',
    guests: 220,
    decoratorName: 'Maison Scénographie Anfa',
    summary:
      'Transformation d’une verrière contemporaine baignée de lumière du jour en un dîner impérial féerique sous ciel étoilé, guirlandes florales suspendues et lanternes en laiton.',
    beforeImage: '/src/assets/images/before_villa_verriere_1794913954878.jpg',
    afterImage: '/src/assets/images/after_villa_verriere_1794913955591.jpg',
    beforeNote: 'Verrière nue · Fin d’après-midi',
    afterNote: 'Après décoration · Dîner aux chandelles',
    highlights: ['Ciel de 1 200 micro-LED', 'Tables impériales en chêne', 'Allée de lanternes dorées'],
  },
  {
    id: 'ba-gala-imperial',
    title: 'Salon d’Apparat — Réception Gala',
    venueName: 'Hôtel Le Corniche Grand Ballroom',
    district: 'Ain Diab',
    guests: 500,
    decoratorName: 'Atelier Floralia Californie',
    summary:
      'Passage d’un grand hall de réception épuré à une mise en scène nocturne haute couture associant arches fleuries, verrerie cristal et rétro-éclairage doré.',
    beforeImage: '/src/assets/images/venue_palais_anfa_1794908654717.jpg',
    afterImage: '/src/assets/images/hero_wedding_casablanca_1794908654336.jpg',
    beforeNote: 'Configuration architecturale initiale',
    afterNote: 'Après scénographie · Réception Gala',
    highlights: ['Lustres cristal XXL', 'Compositions florales blanches', 'Son & lumière synchronisés'],
  },
];

export function BeforeAfterGallerySection() {
  const { navigate, providers, openQuoteModal } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(52);
  const [isDragging, setIsDragging] = useState(false);
  const [hasSwept, setHasSwept] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const stageRef = useRef<HTMLDivElement>(null);
  const activeCase = BEFORE_AFTER_CASES[activeCaseIndex];

  // Gentle initial reveal sweep when entering the viewport
  useEffect(() => {
    if (shouldReduceMotion || hasSwept) return;
    const el = stageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasSwept(true);
          setSliderPos(24);
          const timer = window.setTimeout(() => {
            setSliderPos(54);
          }, 220);
          observer.disconnect();
          return () => window.clearTimeout(timer);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldReduceMotion, hasSwept]);

  const updatePositionFromClientX = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const rawPct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(2, Math.min(98, Math.round(rawPct * 10) / 10));
    setSliderPos(clamped);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePositionFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePositionFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const handleSelectCase = (idx: number) => {
    setActiveCaseIndex(idx);
    setSliderPos(52);
  };

  const matchingDecorator = providers.find((p) => p.categorySlug === 'decoration');

  return (
    <section
      aria-label="Galerie Before & After — Transformation de salles"
      className="bg-white border-y border-[#151515]/10 py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header + Case Selector */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-1.5">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#A8843E] block">
              Before &amp; After
            </span>
            <TextRevealTitle
              as="h2"
              surface="light"
              text="L’art de métamorphoser un lieu d’exception"
              className="font-display text-3xl sm:text-4xl font-semibold text-[#151515]"
            />
            <p className="text-sm text-[#777777] leading-relaxed">
              Déplacez le curseur interactif de gauche à droite pour révéler la transformation complète d&apos;une salle avant et après sa décoration sur mesure.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Choisir une transformation de salle"
            className="flex flex-wrap items-center gap-2"
          >
            {BEFORE_AFTER_CASES.map((item, idx) => {
              const isSelected = idx === activeCaseIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectCase(idx)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#151515] text-[#C9A45C]'
                      : 'bg-[#F7F4EF] text-[#151515]/80 border border-[#151515]/10 hover:border-[#C9A45C] hover:text-[#151515]'
                  }`}
                >
                  {item.district} · {item.venueName.split(' ')[0]} {item.venueName.split(' ')[1] || ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Comparison Stage */}
        <motion.div
          key={activeCase.id}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative aspect-[16/9] max-h-[600px] w-full rounded-2xl overflow-hidden bg-[#151515] border border-[#151515]/15 select-none touch-none cursor-ew-resize shadow-xl"
          >
            {/* Base Layer: BEFORE (Full Width) */}
            {failedImages[`before-${activeCase.id}`] ? (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a2722] to-[#151515] flex items-center justify-center">
                <span className="font-display text-2xl text-white/70">{activeCase.beforeNote}</span>
              </div>
            ) : (
              <img
                src={activeCase.beforeImage}
                alt={`${activeCase.title} — Avant décoration`}
                draggable={false}
                referrerPolicy="no-referrer"
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [`before-${activeCase.id}`]: true }))
                }
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Revealed Layer: AFTER (Clipped smoothly by sliderPos) */}
            <div
              style={{
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                transition: isDragging
                  ? 'none'
                  : 'clip-path 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="absolute inset-0 pointer-events-none"
            >
              {failedImages[`after-${activeCase.id}`] ? (
                <div className="w-full h-full bg-gradient-to-br from-[#262118] to-[#151515] flex items-center justify-center">
                  <span className="font-display text-2xl text-[#C9A45C]">{activeCase.afterNote}</span>
                </div>
              ) : (
                <img
                  src={activeCase.afterImage}
                  alt={`${activeCase.title} — Après décoration`}
                  draggable={false}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [`after-${activeCase.id}`]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Subtle Edge Scrims for Corner Readability */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />

            {/* Unboxed Corner Captions */}
            <div className="absolute top-4 left-4 sm:top-5 sm:left-5 px-3 py-1.5 rounded-lg bg-black/65 backdrop-blur-sm border border-white/15 pointer-events-none">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#C9A45C] block">
                Après
              </span>
              <span className="text-xs text-white/90 hidden sm:inline">
                {activeCase.afterNote}
              </span>
            </div>

            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 px-3 py-1.5 rounded-lg bg-black/65 backdrop-blur-sm border border-white/15 text-right pointer-events-none">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-white/75 block">
                Avant
              </span>
              <span className="text-xs text-white/90 hidden sm:inline">
                {activeCase.beforeNote}
              </span>
            </div>

            {/* Interactive Gold Split Line & Handle */}
            <div
              style={{
                left: `${sliderPos}%`,
                transition: isDragging
                  ? 'none'
                  : 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="absolute inset-y-0 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="w-0.5 flex-1 bg-[#C9A45C] shadow-[0_0_12px_rgba(201,164,92,0.85)]" />
              <div
                className={`w-11 h-11 rounded-full bg-[#151515] border-2 border-[#C9A45C] text-[#C9A45C] shadow-2xl flex items-center justify-center transition-transform duration-150 ${
                  isDragging ? 'scale-110' : 'scale-100'
                }`}
              >
                <MoveHorizontal className="w-5 h-5" />
              </div>
              <div className="w-0.5 flex-1 bg-[#C9A45C] shadow-[0_0_12px_rgba(201,164,92,0.85)]" />
            </div>

            {/* Accessible Keyboard Range Control */}
            <input
              type="range"
              min={2}
              max={98}
              value={Math.round(sliderPos)}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label={`Curseur de comparaison Avant et Après pour ${activeCase.title}`}
              className="sr-only"
            />
          </div>

          {/* Quick Reveal Controls + Case Editorial Summary */}
          <div className="bg-[#F7F4EF] border border-[#151515]/10 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#A8843E] tabular-nums">
                <span>{activeCase.venueName}</span>
                <span aria-hidden="true">·</span>
                <span>{activeCase.district}, Casablanca</span>
                <span aria-hidden="true">·</span>
                <span>{activeCase.guests} invités</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#151515]/70">Scénographie : {activeCase.decoratorName}</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#151515]">
                {activeCase.title}
              </h3>

              <p className="text-sm text-[#777777] leading-relaxed">
                {activeCase.summary}
              </p>

              <p className="text-xs font-medium text-[#151515]/80 pt-1">
                {activeCase.highlights.join('  ·  ')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              {/* Preset Position Controls */}
              <div className="inline-flex items-center gap-1 p-1 bg-white border border-[#151515]/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSliderPos(8)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    sliderPos <= 15
                      ? 'bg-[#151515] text-white'
                      : 'text-[#777777] hover:text-[#151515]'
                  }`}
                >
                  Avant
                </button>
                <button
                  type="button"
                  onClick={() => setSliderPos(50)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums ${
                    sliderPos > 15 && sliderPos < 85
                      ? 'bg-[#C9A45C] text-[#151515]'
                      : 'text-[#777777] hover:text-[#151515]'
                  }`}
                >
                  50 / 50
                </button>
                <button
                  type="button"
                  onClick={() => setSliderPos(92)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    sliderPos >= 85
                      ? 'bg-[#151515] text-[#C9A45C]'
                      : 'text-[#777777] hover:text-[#151515]'
                  }`}
                >
                  Après
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate('decoration')}
                  className="px-4 py-2.5 rounded-lg border border-[#151515]/15 bg-white text-xs font-semibold text-[#151515] hover:border-[#C9A45C] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5 text-[#A8843E]" />
                  Voir les décorateurs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (matchingDecorator) {
                      openQuoteModal(matchingDecorator);
                    } else {
                      navigate('decoration');
                    }
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[#151515] text-white text-xs font-semibold hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  Demander un devis
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
