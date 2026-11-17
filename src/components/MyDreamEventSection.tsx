import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { TextRevealTitle } from './TextRevealTitle.tsx';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  Download,
  Flower2,
  Music,
  RotateCcw,
  Sparkles,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  CASABLANCA_DISTRICTS,
  CATEGORY_LABELS,
  formatDH,
  generateProjectQuotePdf,
} from '../utils/pdfExport.ts';
import type { CategorySlug, Provider } from '../types.ts';

interface StepDef {
  id: number;
  shortLabel: string;
  title: string;
}

const STEPS: StepDef[] = [
  { id: 1, shortLabel: 'Événement', title: 'Quel événement imaginez-vous ?' },
  { id: 2, shortLabel: 'Invités', title: 'Combien d’invités attendez-vous ?' },
  { id: 3, shortLabel: 'Budget', title: 'Quel est votre budget global ?' },
  { id: 4, shortLabel: 'Prestations', title: 'Quelles prestations inclure ?' },
  { id: 5, shortLabel: 'Récapitulatif', title: 'Votre estimation personnalisée' },
];

const EVENT_CARDS = [
  {
    value: 'Mariage',
    subtitle: 'Cérémonie, dîner de gala et soirée dansante',
    coeff: 1.15,
  },
  {
    value: 'Fiançailles',
    subtitle: 'Réception intimiste et mise en scène florale',
    coeff: 0.95,
  },
  {
    value: 'Anniversaire',
    subtitle: 'Soirée privée festive, cocktail et DJ set',
    coeff: 0.85,
  },
  {
    value: 'Soirée privée',
    subtitle: 'Dîner exclusif en villa ou terrasse vue mer',
    coeff: 0.9,
  },
  {
    value: 'Conférence',
    subtitle: 'Plénière, régie audiovisuelle et pauses VIP',
    coeff: 0.95,
  },
  {
    value: 'Lancement de produit',
    subtitle: 'Scénographie de marque et cocktail presse',
    coeff: 1.05,
  },
];

const GUEST_PRESETS = [
  { label: 'Intimiste', range: '30 – 80 invités', value: 60 },
  { label: 'Réception moyenne', range: '80 – 180 invités', value: 140 },
  { label: 'Grand format', range: '180 – 350 invités', value: 250 },
  { label: 'Prestige / Royal', range: '350 – 600+ invités', value: 450 },
];

const BUDGET_PRESETS = [
  { label: 'Essentiel', value: 60000, note: 'Réception élégante et ciblée' },
  { label: 'Signature', value: 140000, note: 'Équilibre idéal à Casablanca' },
  { label: 'Prestige', value: 260000, note: 'Adresses 5★ et scénographie' },
  { label: 'Sur-mesure Royal', value: 420000, note: 'Privatisation intégrale & VIP' },
];

const SERVICE_CARDS: {
  slug: CategorySlug;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  baseFixed: number;
  perGuest: number;
}[] = [
  {
    slug: 'salles',
    label: 'Salles de réception',
    desc: 'Palais, villas avec jardin, hôtels et domaines',
    icon: Building2,
    baseFixed: 24000,
    perGuest: 95,
  },
  {
    slug: 'traiteurs',
    label: 'Traiteurs & Gastronomie',
    desc: 'Menus marocains royaux, cocktails et wedding cakes',
    icon: Utensils,
    baseFixed: 4000,
    perGuest: 380,
  },
  {
    slug: 'photographes',
    label: 'Photographes & Vidéastes',
    desc: 'Reportage photo éditorial, film 4K et drone',
    icon: Camera,
    baseFixed: 13500,
    perGuest: 15,
  },
  {
    slug: 'dj',
    label: 'DJ & Animation',
    desc: 'DJ, orchestre, sonorisation et éclairage scénique',
    icon: Music,
    baseFixed: 11000,
    perGuest: 20,
  },
  {
    slug: 'decoration',
    label: 'Décoration & Art floral',
    desc: 'Arches florales, arts de la table et scénographie',
    icon: Flower2,
    baseFixed: 12500,
    perGuest: 45,
  },
  {
    slug: 'organisation',
    label: 'Organisation complète',
    desc: 'Chef de projet et coordination le jour J',
    icon: Sparkles,
    baseFixed: 16000,
    perGuest: 25,
  },
];

export function MyDreamEventSection() {
  const { providers, navigate, openProviderDetail, showToast } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [eventType, setEventType] = useState<string>('Mariage');
  const [district, setDistrict] = useState<string>('Anfa');
  const [guests, setGuests] = useState<number>(180);
  const [budget, setBudget] = useState<number>(180000);
  const [selectedServices, setSelectedServices] = useState<CategorySlug[]>([
    'salles',
    'traiteurs',
    'photographes',
    'dj',
    'decoration',
  ]);

  const progressRatio = step / STEPS.length;
  const progressPercent = Math.round(progressRatio * 100);

  const goToStep = (target: number) => {
    const clamped = Math.max(1, Math.min(STEPS.length, target));
    if (clamped === step) return;
    setDirection(clamped > step ? 1 : -1);
    setStep(clamped);
  };

  const toggleService = (slug: CategorySlug) => {
    setSelectedServices((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) {
          showToast('Sélectionnez au moins une prestation pour générer une estimation.', 'info');
          return prev;
        }
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  };

  // Dynamic personalized estimation combining real Casablanca providers & guest/event coefficients
  const estimation = useMemo(() => {
    const eventInfo = EVENT_CARDS.find((e) => e.value === eventType) || EVENT_CARDS[0];
    const standingFactor = budget >= 300000 ? 1.28 : budget >= 160000 ? 1.05 : 0.88;

    const breakdown = selectedServices.map((slug) => {
      const card = SERVICE_CARDS.find((c) => c.slug === slug)!;
      // Match real approved provider from database when available
      const matchingProviders = providers.filter(
        (p) =>
          p.categorySlug === slug &&
          (slug !== 'salles' || p.capacityMax >= Math.min(guests, 250))
      );
      const recommendedProvider: Provider | undefined =
        matchingProviders.find((p) => p.district === district) ||
        matchingProviders.find((p) => p.featured) ||
        matchingProviders[0];

      let estimatedPrice = Math.round(
        (card.baseFixed + card.perGuest * guests) * eventInfo.coeff * standingFactor
      );

      if (recommendedProvider) {
        if (slug === 'traiteurs' && recommendedProvider.priceFrom < 2000) {
          estimatedPrice = Math.round(recommendedProvider.priceFrom * guests * standingFactor);
        } else {
          estimatedPrice = Math.round(
            Math.max(recommendedProvider.priceFrom, card.baseFixed + card.perGuest * guests * 0.5) *
              (standingFactor >= 1.2 ? 1.15 : 1)
          );
        }
      }

      // Round nicely to nearest 500 DH
      estimatedPrice = Math.round(estimatedPrice / 500) * 500;

      return {
        slug,
        label: card.label,
        estimatedPrice,
        recommendedProvider,
      };
    });

    const totalEstimated = breakdown.reduce((sum, item) => sum + item.estimatedPrice, 0);
    const minRange = Math.round((totalEstimated * 0.9) / 1000) * 1000;
    const maxRange = Math.round((totalEstimated * 1.12) / 1000) * 1000;
    const perGuestCost = guests > 0 ? Math.round(totalEstimated / guests) : 0;
    const budgetDelta = budget - totalEstimated;
    const budgetCoveragePercent =
      budget > 0 ? Math.min(100, Math.round((totalEstimated / budget) * 100)) : 100;

    return {
      breakdown,
      totalEstimated,
      minRange,
      maxRange,
      perGuestCost,
      budgetDelta,
      budgetCoveragePercent,
    };
  }, [budget, district, eventType, guests, providers, selectedServices]);

  const handleReset = () => {
    setDirection(-1);
    setStep(1);
    setEventType('Mariage');
    setDistrict('Anfa');
    setGuests(180);
    setBudget(180000);
    setSelectedServices(['salles', 'traiteurs', 'photographes', 'dj', 'decoration']);
  };

  const handleDownloadPdf = () => {
    generateProjectQuotePdf({
      title: `My Dream Event · ${eventType} à ${district}`,
      eventType,
      eventDate: 'À définir',
      district,
      guests,
      budget,
      selectedProviders: estimation.breakdown.map((b) => ({
        providerName: b.recommendedProvider?.name || `Estimation ${b.label}`,
        categorySlug: b.slug,
        price: b.estimatedPrice,
        formulaName: b.recommendedProvider ? 'Partenaire recommandé' : 'Estimation Casablanca',
      })),
      totalCost: estimation.totalEstimated,
    });
    showToast('Estimation personnalisée téléchargée en PDF.', 'success');
  };

  const handleLaunchBuilder = () => {
    navigate('event-builder', {
      eventType,
      district,
      guests,
    });
  };

  return (
    <section
      id="my-dream-event"
      aria-label="My Dream Event — Configurateur d'événement"
      className="bg-white border-y border-[#151515]/10 py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-1.5">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#A8843E] block">
              My Dream Event
            </span>
            <TextRevealTitle
              as="h2"
              surface="light"
              text="Concevez votre événement sur mesure en 4 étapes"
              className="font-display text-3xl sm:text-4xl font-semibold text-[#151515]"
            />
            <p className="text-sm text-[#777777] leading-relaxed">
              Définissez votre format, vos invités, votre budget et vos prestations pour obtenir une estimation réaliste basée sur nos partenaires à Casablanca.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#777777] hover:text-[#151515] transition-colors self-start md:self-auto whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>

        {/* Configurator Shell */}
        <div className="bg-[#F7F4EF] border border-[#151515]/10 rounded-2xl overflow-hidden">
          {/* Animated Progress Header */}
          <div className="bg-[#151515] text-white px-6 sm:px-8 pt-6 pb-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#C9A45C]">
                <span className="font-mono tabular-nums">
                  Étape {String(step).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-white/80">{STEPS[step - 1].title}</span>
              </div>
              <span className="font-mono text-xs font-semibold text-[#C9A45C] tabular-nums">
                {progressPercent}% complété
              </span>
            </div>

            {/* GPU-composited Animated Progress Track */}
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-[#A8843E] via-[#C9A45C] to-[#E5C98B] origin-left"
                initial={false}
                animate={{ scaleX: progressRatio }}
                transition={{
                  duration: shouldReduceMotion ? 0.15 : 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>

            {/* Step Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STEPS.map((s) => {
                const isActive = s.id === step;
                const isDone = s.id < step;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(s.id)}
                    className={`px-3 py-2 rounded-lg text-left text-xs transition-colors flex items-center gap-2 whitespace-nowrap overflow-hidden ${
                      isActive
                        ? 'bg-[#C9A45C] text-[#151515] font-semibold'
                        : isDone
                        ? 'bg-white/10 text-white hover:bg-white/15'
                        : 'bg-white/[0.03] text-white/55 hover:bg-white/10 hover:text-white/85'
                    }`}
                  >
                    <span className="font-mono tabular-nums shrink-0">
                      {isDone ? <Check className="w-3.5 h-3.5 text-[#C9A45C]" /> : `0${s.id}`}
                    </span>
                    <span className="truncate">{s.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Body: Interactive Step + Live Sticky Summary Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Interactive Step Area */}
            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between min-h-[430px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: direction > 0 ? 24 : -24 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: direction > 0 ? -24 : 24 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0.12 : 0.28,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="space-y-6"
                >
                  {/* STEP 1: EVENT TYPE & DISTRICT */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {EVENT_CARDS.map((card) => {
                          const selected = eventType === card.value;
                          return (
                            <button
                              key={card.value}
                              type="button"
                              onClick={() => setEventType(card.value)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                selected
                                  ? 'bg-[#151515] text-white border-[#151515] shadow-sm'
                                  : 'bg-white text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-display text-xl font-semibold">
                                  {card.value}
                                </span>
                                {selected && <Check className="w-4 h-4 text-[#C9A45C] shrink-0" />}
                              </div>
                              <p
                                className={`text-xs leading-relaxed ${
                                  selected ? 'text-white/75' : 'text-[#777777]'
                                }`}
                              >
                                {card.subtitle}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-[#151515]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label
                            htmlFor="dream-district"
                            className="text-xs font-semibold text-[#151515] block"
                          >
                            Quartier souhaité à Casablanca
                          </label>
                          <span className="text-xs text-[#777777]">
                            Ajuste les recommandations de salles et prestataires de proximité.
                          </span>
                        </div>
                        <select
                          id="dream-district"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-[#151515]/20 bg-white text-sm font-medium text-[#151515] min-w-[200px]"
                        >
                          {CASABLANCA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: NUMBER OF GUESTS */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="bg-white border border-[#151515]/10 rounded-xl p-6 space-y-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#A8843E]">
                            Capacité estimée
                          </span>
                          <div className="font-display text-4xl font-semibold text-[#151515] tabular-nums">
                            {guests} <span className="text-lg font-sans font-normal text-[#777777]">invités</span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={20}
                          max={650}
                          step={10}
                          value={guests}
                          onChange={(e) => setGuests(Number(e.target.value))}
                          aria-label="Nombre d'invités"
                          className="w-full accent-[#C9A45C] cursor-pointer"
                        />

                        <div className="flex justify-between text-[11px] font-mono text-[#777777] tabular-nums">
                          <span>20 pers.</span>
                          <span>200 pers.</span>
                          <span>400 pers.</span>
                          <span>650 pers.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {GUEST_PRESETS.map((preset) => {
                          const active = Math.abs(guests - preset.value) <= 25;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setGuests(preset.value)}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                active
                                  ? 'bg-[#151515] text-white border-[#151515]'
                                  : 'bg-white text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]'
                              }`}
                            >
                              <span className="text-xs font-semibold block">{preset.label}</span>
                              <span
                                className={`text-[11px] tabular-nums ${
                                  active ? 'text-[#C9A45C]' : 'text-[#777777]'
                                }`}
                              >
                                {preset.range}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: TARGET BUDGET */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="bg-white border border-[#151515]/10 rounded-xl p-6 space-y-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#A8843E]">
                            Enveloppe globale souhaitée
                          </span>
                          <div className="text-right">
                            <span className="font-display text-4xl font-semibold text-[#151515] tabular-nums block">
                              {formatDH(budget)}
                            </span>
                            <span className="text-xs text-[#777777] tabular-nums">
                              Soit environ {formatDH(guests > 0 ? Math.round(budget / guests) : 0)} / invité
                            </span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={25000}
                          max={600000}
                          step={5000}
                          value={budget}
                          onChange={(e) => setBudget(Number(e.target.value))}
                          aria-label="Budget cible en Dirhams"
                          className="w-full accent-[#C9A45C] cursor-pointer"
                        />

                        <div className="flex justify-between text-[11px] font-mono text-[#777777] tabular-nums">
                          <span>25 000 DH</span>
                          <span>150 000 DH</span>
                          <span>350 000 DH</span>
                          <span>600 000 DH</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {BUDGET_PRESETS.map((preset) => {
                          const active = Math.abs(budget - preset.value) <= 20000;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setBudget(preset.value)}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                active
                                  ? 'bg-[#151515] text-white border-[#151515]'
                                  : 'bg-white text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]'
                              }`}
                            >
                              <span className="text-xs font-semibold block">{preset.label}</span>
                              <span
                                className={`text-sm font-display font-semibold tabular-nums block my-0.5 ${
                                  active ? 'text-[#C9A45C]' : 'text-[#A8843E]'
                                }`}
                              >
                                {formatDH(preset.value)}
                              </span>
                              <span
                                className={`text-[11px] block ${
                                  active ? 'text-white/70' : 'text-[#777777]'
                                }`}
                              >
                                {preset.note}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: SERVICES SELECTION */}
                  {step === 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {SERVICE_CARDS.map((srv) => {
                        const isSelected = selectedServices.includes(srv.slug);
                        const Icon = srv.icon;
                        return (
                          <button
                            key={srv.slug}
                            type="button"
                            onClick={() => toggleService(srv.slug)}
                            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                              isSelected
                                ? 'bg-[#151515] text-white border-[#151515]'
                                : 'bg-white text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#C9A45C] text-[#151515]'
                                  : 'bg-[#F7F4EF] text-[#A8843E]'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-sm truncate">{srv.label}</span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#C9A45C] shrink-0" />
                                )}
                              </div>
                              <p
                                className={`text-xs mt-1 leading-relaxed ${
                                  isSelected ? 'text-white/70' : 'text-[#777777]'
                                }`}
                              >
                                {srv.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* STEP 5: PERSONALIZED SUMMARY & BUDGET ESTIMATION */}
                  {step === 5 && (
                    <div className="space-y-5">
                      <div className="bg-white border border-[#151515]/10 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#151515]/10">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#A8843E] block">
                              Fourchette estimative Casablanca
                            </span>
                            <div className="font-display text-3xl sm:text-4xl font-semibold text-[#151515] tabular-nums mt-0.5">
                              {formatDH(estimation.minRange)} – {formatDH(estimation.maxRange)}
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <span className="text-xs text-[#777777] block">Budget cible défini</span>
                            <span className="font-mono text-base font-semibold text-[#151515] tabular-nums">
                              {formatDH(budget)}
                            </span>
                            <span
                              className={`text-xs block font-medium tabular-nums ${
                                estimation.budgetDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {estimation.budgetDelta >= 0
                                ? `Marge disponible : +${formatDH(estimation.budgetDelta)}`
                                : `Dépassement estimé : +${formatDH(Math.abs(estimation.budgetDelta))}`}
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-[#151515]/10">
                          {estimation.breakdown.map((row) => (
                            <div
                              key={row.slug}
                              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#151515]">
                                  {CATEGORY_LABELS[row.slug]}
                                </p>
                                {row.recommendedProvider ? (
                                  <button
                                    type="button"
                                    onClick={() => openProviderDetail(row.recommendedProvider!)}
                                    className="text-xs text-[#A8843E] hover:underline text-left"
                                  >
                                    Suggestion : {row.recommendedProvider.name} ({row.recommendedProvider.district}) →
                                  </button>
                                ) : (
                                  <span className="text-xs text-[#777777]">
                                    Estimation standard Casablanca ({guests} invités)
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-sm font-semibold text-[#151515] tabular-nums shrink-0">
                                {formatDH(row.estimatedPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleLaunchBuilder}
                          className="px-6 py-3 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                        >
                          Sélectionner mes prestataires dans l&apos;Event Builder
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          className="px-5 py-3 bg-white border border-[#151515]/20 text-[#151515] text-xs font-semibold rounded-lg hover:border-[#151515] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                        >
                          <Download className="w-4 h-4 text-[#A8843E]" />
                          Télécharger l&apos;estimation PDF
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Step Footer Navigation */}
              <div className="pt-6 mt-6 border-t border-[#151515]/10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => goToStep(step - 1)}
                  className="px-4 py-2.5 rounded-lg border border-[#151515]/15 bg-white text-xs font-semibold text-[#151515] hover:border-[#151515] disabled:opacity-40 disabled:pointer-events-none transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>

                {step < STEPS.length ? (
                  <button
                    type="button"
                    onClick={() => goToStep(step + 1)}
                    className="px-6 py-2.5 rounded-lg bg-[#151515] text-white text-xs font-semibold hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    {step === 4 ? 'Générer mon récapitulatif' : 'Étape suivante'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="px-5 py-2.5 rounded-lg border border-[#151515]/15 bg-white text-xs font-semibold text-[#151515] hover:border-[#C9A45C] transition-colors whitespace-nowrap shrink-0"
                  >
                    Ajuster mes critères
                  </button>
                )}
              </div>
            </div>

            {/* Right Live Personalized Preview Panel */}
            <aside className="lg:col-span-4 bg-white border-t lg:border-t-0 lg:border-l border-[#151515]/10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-[#A8843E] block">
                    Aperçu en direct
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-[#151515]">
                    {eventType} · {district}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#F7F4EF]">
                    <span className="text-[#777777] flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-[#A8843E]" />
                      Invités
                    </span>
                    <span className="font-semibold text-sm text-[#151515] tabular-nums">
                      {guests} personnes
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F7F4EF]">
                    <span className="text-[#777777] flex items-center gap-1.5 mb-1">
                      <Wallet className="w-3.5 h-3.5 text-[#A8843E]" />
                      Budget cible
                    </span>
                    <span className="font-semibold text-sm text-[#151515] tabular-nums">
                      {formatDH(budget)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#151515] block">
                    Prestations sélectionnées ({selectedServices.length})
                  </span>
                  <ul className="space-y-1.5 text-xs">
                    {estimation.breakdown.map((item) => (
                      <li
                        key={item.slug}
                        className="flex items-center justify-between gap-2 text-[#151515]/85"
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="font-mono text-[11px] text-[#777777] tabular-nums shrink-0">
                          {formatDH(item.estimatedPrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-5 border-t border-[#151515]/10 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-[#777777]">Estimation totale</span>
                  <span className="font-display text-3xl font-semibold text-[#151515] tabular-nums">
                    {formatDH(estimation.totalEstimated)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-[#F7F4EF] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full w-full origin-left ${
                        estimation.budgetDelta >= 0 ? 'bg-[#C9A45C]' : 'bg-amber-600'
                      }`}
                      initial={false}
                      animate={{
                        scaleX: Math.min(1, Math.max(0.08, estimation.budgetCoveragePercent / 100)),
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#777777] tabular-nums">
                    <span>Coût / invité : {formatDH(estimation.perGuestCost)}</span>
                    <span>{estimation.budgetCoveragePercent}% du budget</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
