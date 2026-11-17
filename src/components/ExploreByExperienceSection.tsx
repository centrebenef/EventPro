import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { TextRevealTitle } from './TextRevealTitle.tsx';
import { ParallaxImage } from './ParallaxImage.tsx';
import type { AppPage } from '../types.ts';

interface ExperienceCard {
  num: string;
  page: AppPage;
  label: string;
  goldTitle: string;
  subtitle: string;
  image: string;
  alt: string;
  meta: string;
}

const EXPERIENCES: ExperienceCard[] = [
  {
    num: '01',
    page: 'salles',
    label: 'Salles',
    goldTitle: 'Salles de réception',
    subtitle: 'Palais d’Anfa, villas avec jardins, hôtels 5 étoiles et domaines privés.',
    image: '/src/assets/images/venue_palais_anfa_1794908654717.jpg',
    alt: 'Salle de réception luxueuse à Casablanca',
    meta: 'Anfa · Ain Diab · Bouskoura',
  },
  {
    num: '02',
    page: 'photographes',
    label: 'Photographes',
    goldTitle: 'Photographes & Vidéastes',
    subtitle: 'Reportages éditoriaux, films cinéma 4K, drone et photobooths signature.',
    image: '/src/assets/images/photo_couple_editorial_1794908655309.jpg',
    alt: 'Photographe de mariage éditorial à Casablanca',
    meta: 'Cinéma 4K · Éditorial · Drone',
  },
  {
    num: '03',
    page: 'traiteurs',
    label: 'Traiteurs',
    goldTitle: 'Traiteurs & Gastronomie',
    subtitle: 'Haute gastronomie marocaine et internationale, cocktails et pièces montées.',
    image: '/src/assets/images/catering_moroccan_gastronomy_1794908656156.jpg',
    alt: 'Traiteur haute gastronomie marocaine à Casablanca',
    meta: 'Gastronomie · Buffets · Pâtisserie',
  },
  {
    num: '04',
    page: 'dj',
    label: 'DJ',
    goldTitle: 'DJ & Animation Live',
    subtitle: 'DJ résidents, orchestres andalous, sonorisation et scénographie lumière.',
    image: '/src/assets/images/dj_gala_night_1794908656727.jpg',
    alt: 'DJ et animation musicale de gala à Casablanca',
    meta: 'DJ Sets · Orchestres · Son & Lumière',
  },
  {
    num: '05',
    page: 'decoration',
    label: 'Décoration',
    goldTitle: 'Décoration & Scénographie',
    subtitle: 'Design floral monumental, arts de la table et arches cérémonielles sur mesure.',
    image: '/src/assets/images/masonry_decor_tablescape_1794909781940.jpg',
    alt: 'Décoration florale et art de la table de luxe',
    meta: 'Art Floral · Scénographie · Mobilier',
  },
  {
    num: '06',
    page: 'organisation',
    label: 'Organisation',
    goldTitle: 'Organisation Complète',
    subtitle: 'Chefs de projet et wedding planners dédiés pour une coordination intégrale.',
    image: '/src/assets/images/hero_wedding_casablanca_1794908654336.jpg',
    alt: 'Organisation complète de mariage et événement à Casablanca',
    meta: 'Basic · Premium · Conciergerie VIP',
  },
];

export function ExploreByExperienceSection() {
  const { navigate } = useApp();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      aria-label="Explore by Experience"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div className="max-w-2xl space-y-1.5">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#A8843E] block">
            Explore by Experience
          </span>
          <TextRevealTitle
            as="h2"
            surface="light"
            text="Six univers d’exception pour orchestrer votre événement"
            className="font-display text-3xl sm:text-4xl font-semibold text-[#151515]"
          />
          <p className="text-sm text-[#777777] leading-relaxed">
            Sélectionnez une discipline pour explorer nos partenaires vérifiés à Casablanca et comparer leurs prestations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('carte')}
          className="text-sm font-semibold text-[#151515] border-b border-[#C9A45C] pb-0.5 hover:text-[#A8843E] transition-colors self-start md:self-auto whitespace-nowrap shrink-0"
        >
          Explorer la carte de Casablanca →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPERIENCES.map((exp) => (
          <button
            key={exp.page}
            type="button"
            onClick={() => navigate(exp.page)}
            className="group relative block w-full text-left h-[380px] sm:h-[420px] rounded-2xl overflow-hidden bg-[#151515] border border-[#151515]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C]"
          >
            {/* Large Photograph with Smooth Zoom Effect */}
            {failedImages[exp.page] ? (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1D1D1D] via-[#262118] to-[#151515] flex items-center justify-center p-6">
                <span className="font-display text-2xl text-[#C9A45C]">{exp.goldTitle}</span>
              </div>
            ) : (
              <ParallaxImage
                src={exp.image}
                alt={exp.alt}
                intensity={18}
                wrapperClassName="absolute inset-0 w-full h-full"
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [exp.page]: true }))
                }
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-focus-visible:scale-110"
              />
            )}

            {/* Base Subtle Contrast Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-500" />

            {/* Progressive Black Veil on Hover / Focus */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 group-focus-visible:bg-black/55 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />

            {/* Resting Minimal Corner Label (fades smoothly as the gold hover title rises) */}
            <div className="absolute inset-x-0 bottom-0 p-7 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-0 group-hover:-translate-y-2 group-focus-visible:opacity-0 [@media(hover:none)]:opacity-0">
              <span className="font-mono text-xs tracking-widest text-white/70 block mb-1">
                {exp.num}
              </span>
              <span className="font-display text-2xl sm:text-3xl font-semibold text-white">
                {exp.label}
              </span>
            </div>

            {/* Gold Title & Details Appearing on Hover (always accessible on touch devices) */}
            <div className="absolute inset-0 p-7 flex flex-col justify-between">
              <div className="flex items-center justify-between opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <span className="font-mono text-xs tracking-widest text-[#C9A45C]">
                  {exp.num} · {exp.meta}
                </span>
                <span className="w-9 h-9 rounded-lg border border-[#C9A45C]/60 bg-black/40 text-[#C9A45C] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>

              <div className="space-y-2.5 opacity-0 translate-y-5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <h3 className="font-display text-3xl sm:text-4xl font-semibold text-[#C9A45C] leading-tight">
                  {exp.goldTitle}
                </h3>
                <p className="text-sm text-white/85 leading-relaxed line-clamp-2">
                  {exp.subtitle}
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-white pt-1 whitespace-nowrap shrink-0">
                  Découvrir cet univers
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A45C]" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
