import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Flower2,
  Sparkles,
  Utensils,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { TextRevealTitle } from './TextRevealTitle.tsx';

interface TimelineMilestone {
  id: string;
  timeframe: string;
  phase: string;
  title: string;
  description: string;
  deliverables: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const MILESTONES: TimelineMilestone[] = [
  {
    id: 'step-booking',
    timeframe: 'J-180 à J-120',
    phase: '01. Réservation & Cadrage',
    title: 'Blocage du lieu et des dates clés',
    description:
      'Sélectionnez votre salle de réception à Casablanca, verrouillez vos disponibilités sans risque de double réservation et fixez votre enveloppe budgétaire en DH.',
    deliverables: ['Disponibilités vérifiées', 'Devis comparatifs PDF', 'Rétroplanning initial'],
    icon: CalendarCheck,
  },
  {
    id: 'step-catering',
    timeframe: 'J-90',
    phase: '02. Gastronomie & Accueil',
    title: 'Dégustation traiteur et validation des menus',
    description:
      'Rencontrez nos chefs partenaires pour composer un dîner marocain royal ou gastronomique sur mesure, calibrer les ateliers cocktails et prévoir la pièce montée.',
    deliverables: ['Menu personnalisé', 'Service & arts de la table', 'Estimation par convive'],
    icon: Utensils,
  },
  {
    id: 'step-design',
    timeframe: 'J-60',
    phase: '03. Scénographie, Image & Son',
    title: 'Design floral, reportage 4K et ambiance musicale',
    description:
      'Validez les planches de décoration florale, planifiez le repérage lumière avec votre photographe et définissez les temps forts musicaux avec votre DJ ou orchestre.',
    deliverables: ['Planche scénographique', 'Brief photo & drone', 'Conducteur musical'],
    icon: Flower2,
  },
  {
    id: 'step-confirm',
    timeframe: 'J-30',
    phase: '04. Confirmations & Logistique',
    title: 'Clôture des effectifs et ajustements finaux',
    description:
      'Arrêtez le nombre définitif d’invités, finalisez le plan de table et validez les options complémentaires telles que le voiturier, l’accueil VIP ou le photobooth.',
    deliverables: ['Liste finale invités', 'Plan d’implantation salle', 'Solde & options validés'],
    icon: ClipboardCheck,
  },
  {
    id: 'step-rehearsal',
    timeframe: 'J-7',
    phase: '05. Répétition & Conducteur',
    title: 'Visite technique et briefing minute par minute',
    description:
      'Coordination finale sur place avec les régisseurs son, lumière, traiteur et décoration afin d’assurer une installation fluide dès la veille ou l’aube.',
    deliverables: ['Feuille de route J-0', 'Contrôle audiovisuel', 'Contacts directs équipe'],
    icon: Clock,
  },
  {
    id: 'step-dday',
    timeframe: 'JOUR J',
    phase: '06. Orchestration Complète',
    title: 'Sérénité absolue et instants inoubliables',
    description:
      'Nos coordinateurs accueillent chaque prestataire, supervisent la mise en place florale et orchestrent chaque passage clé : il ne vous reste plus qu’à célébrer.',
    deliverables: ['Supervision sur place', 'Timing respecté à la minute', 'Souvenirs éternels'],
    icon: Sparkles,
  },
];

export function EventTimelineSection() {
  const { navigate } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(MILESTONES[0].id);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 75%', 'end 65%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <section
      aria-label="Event Timeline — Frise chronologique de préparation"
      className="bg-[#F7F4EF] py-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#A8843E] block">
              Event Timeline
            </span>
            <TextRevealTitle
              as="h2"
              surface="light"
              text="De la première réservation jusqu’au jour J"
              className="font-display text-3xl sm:text-4xl font-semibold text-[#151515]"
            />
            <p className="text-sm text-[#777777] leading-relaxed">
              Une chronologie maîtrisée étape par étape pour préparer votre réception à Casablanca sans stress ni oubli.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('event-builder')}
            className="px-5 py-3 rounded-lg bg-[#151515] text-white text-xs font-semibold hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center gap-2 self-start md:self-auto whitespace-nowrap shrink-0"
          >
            Démarrer mon rétroplanning
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Chronological Spine & Milestones */}
        <div ref={timelineRef} className="relative">
          {/* Static Background Spine */}
          <div
            aria-hidden="true"
            className="absolute left-5 md:left-1/2 top-2 bottom-2 w-px bg-[#151515]/15 md:-translate-x-1/2"
          />

          {/* Scroll-Driven Animated Gold Spine */}
          <motion.div
            aria-hidden="true"
            style={{
              scaleY: shouldReduceMotion ? 1 : smoothProgress,
            }}
            className="absolute left-5 md:left-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#A8843E] via-[#C9A45C] to-[#151515] origin-top md:-translate-x-1/2"
          />

          <div className="space-y-10 md:space-y-12">
            {MILESTONES.map((milestone, index) => {
              const Icon = milestone.icon;
              const isLeft = index % 2 === 0;
              const isSelected = activeId === milestone.id;
              const isFinalDay = milestone.timeframe === 'JOUR J';

              return (
                <div
                  key={milestone.id}
                  className="relative grid grid-cols-1 md:grid-cols-2 items-center"
                >
                  {/* Center / Left Timeline Node */}
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute left-5 md:left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                      isFinalDay || isSelected
                        ? 'bg-[#151515] border-[#C9A45C] text-[#C9A45C] shadow-md'
                        : 'bg-white border-[#C9A45C]/70 text-[#A8843E]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>

                  {/* Card Column Placement (Alternating left/right on md+) */}
                  <motion.div
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 20, x: isLeft ? -18 : 18 }
                    }
                    whileInView={{ opacity: 1, y: 0, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      duration: shouldReduceMotion ? 0.15 : 0.55,
                      delay: shouldReduceMotion ? 0 : 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`pl-14 md:pl-0 ${
                      isLeft
                        ? 'md:col-start-1 md:pr-12'
                        : 'md:col-start-2 md:pl-12'
                    }`}
                  >
                    <div
                      onClick={() => setActiveId(milestone.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveId(milestone.id);
                        }
                      }}
                      className={`cursor-pointer rounded-2xl p-6 sm:p-7 border transition-all duration-300 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] ${
                        isFinalDay
                          ? 'bg-[#151515] text-white border-[#C9A45C]/70 shadow-lg'
                          : isSelected
                          ? 'bg-white text-[#151515] border-[#C9A45C] shadow-md'
                          : 'bg-white text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]/80'
                      }`}
                    >
                      {/* Unboxed Chronological Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span
                            className={`font-mono tabular-nums ${
                              isFinalDay ? 'text-[#C9A45C]' : 'text-[#A8843E]'
                            }`}
                          >
                            {milestone.timeframe}
                          </span>
                          <span
                            aria-hidden="true"
                            className={isFinalDay ? 'text-white/35' : 'text-[#151515]/25'}
                          >
                            ·
                          </span>
                          <span className={isFinalDay ? 'text-white/80' : 'text-[#777777]'}>
                            {milestone.phase}
                          </span>
                        </div>
                      </div>

                      <h3
                        className={`font-display text-2xl font-semibold mb-2 leading-snug ${
                          isFinalDay ? 'text-white' : 'text-[#151515]'
                        }`}
                      >
                        {milestone.title}
                      </h3>

                      <p
                        className={`text-sm leading-relaxed mb-4 ${
                          isFinalDay ? 'text-white/75' : 'text-[#777777]'
                        }`}
                      >
                        {milestone.description}
                      </p>

                      {/* Deliverables Row */}
                      <div
                        className={`pt-3.5 border-t flex flex-wrap gap-x-4 gap-y-1.5 text-xs ${
                          isFinalDay
                            ? 'border-white/10 text-white/85'
                            : 'border-[#151515]/10 text-[#151515]/80'
                        }`}
                      >
                        {milestone.deliverables.map((item) => (
                          <span key={item} className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
