import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { TextRevealTitle } from './TextRevealTitle.tsx';
import { ParallaxImage } from './ParallaxImage.tsx';
import type { RealizationItem } from '../types.ts';

export type MasonryCategory =
  | 'Toutes'
  | 'Mariages'
  | 'Décorations'
  | 'Soirées'
  | 'Événements professionnels';

export interface MasonryGalleryItem {
  id: string;
  title: string;
  category: Exclude<MasonryCategory, 'Toutes'>;
  district: string;
  guests: number;
  image: string;
  description: string;
  aspectHint: string;
}

const CURATED_MASONRY_ITEMS: MasonryGalleryItem[] = [
  {
    id: 'mas-wedding-aisle',
    title: 'Cérémonie Florale au Palais d’Anfa',
    category: 'Mariages',
    district: 'Anfa',
    guests: 380,
    image: '/src/assets/images/masonry_wedding_ceremony_1794909781544.jpg',
    description:
      'Allée nuptiale sculptée de roses blanches, lustres en cristal et colonnades marocaines éclairées à la bougie.',
    aspectHint: 'aspect-[3/4]',
  },
  {
    id: 'mas-soiree-ain-diab',
    title: 'Cocktail Sunset sur la Corniche',
    category: 'Soirées',
    district: 'Ain Diab',
    guests: 160,
    image: '/src/assets/images/masonry_soiree_cocktail_1794909783107.jpg',
    description:
      'Terrasse lounge panoramique face à l’Atlantique, bar signature doré et ambiance musicale deep-house.',
    aspectHint: 'aspect-square',
  },
  {
    id: 'mas-corporate-summit',
    title: 'Sommet Financier & Dîner de Gala',
    category: 'Événements professionnels',
    district: 'Casablanca Finance City',
    guests: 450,
    image: '/src/assets/images/masonry_corporate_conference_1794909784522.jpg',
    description:
      'Scénographie plénière grand format, éclairage architectural ambré et régie audiovisuelle 4K.',
    aspectHint: 'aspect-[4/3]',
  },
  {
    id: 'mas-decor-tablescape',
    title: 'Table Impériale aux Orchidées Blanches',
    category: 'Décorations',
    district: 'Californie',
    guests: 240,
    image: '/src/assets/images/masonry_decor_tablescape_1794909781940.jpg',
    description:
      'Art de la table sur mesure avec verrerie taillée, vaisselle dorée à l’or fin et cascades florales.',
    aspectHint: 'aspect-[3/4]',
  },
  {
    id: 'mas-wedding-royal',
    title: 'Réception Royale sous Lustres Géants',
    category: 'Mariages',
    district: 'Bouskoura',
    guests: 500,
    image: '/src/assets/images/hero_wedding_casablanca_1794908654336.jpg',
    description:
      'Mise en scène magistrale pour un mariage de prestige réunissant orchestrations classiques et traditions marocaines.',
    aspectHint: 'aspect-video',
  },
  {
    id: 'mas-decor-floral',
    title: 'Arche Florale & Scénographie Lumière',
    category: 'Décorations',
    district: 'Oasis',
    guests: 200,
    image: '/src/assets/images/decor_floral_luxury_1794908655561.jpg',
    description:
      'Composition botanique aérienne, draperies ivoire et jeux de bougies reflétés dans le marbre.',
    aspectHint: 'aspect-[4/3]',
  },
  {
    id: 'mas-soiree-dj',
    title: 'Gala Nocturne & Set DJ Live',
    category: 'Soirées',
    district: 'Gauthier',
    guests: 280,
    image: '/src/assets/images/dj_gala_night_1794908656727.jpg',
    description:
      'Soirée privée rythmée par un show lumière synchronisé, percussionnistes live et piste miroir.',
    aspectHint: 'aspect-[4/3]',
  },
  {
    id: 'mas-wedding-editorial',
    title: 'Reportage Éditorial des Mariés',
    category: 'Mariages',
    district: 'Palais d’Anfa',
    guests: 320,
    image: '/src/assets/images/photo_couple_editorial_1794908655309.jpg',
    description:
      'Séance portrait cinématographique capturée à l’heure dorée dans les patios historiques de Casablanca.',
    aspectHint: 'aspect-[4/3]',
  },
  {
    id: 'mas-corp-gastronomy',
    title: 'Dîner Exécutif Haute Gastronomie',
    category: 'Événements professionnels',
    district: 'Sidi Maarouf',
    guests: 180,
    image: '/src/assets/images/catering_moroccan_gastronomy_1794908656156.jpg',
    description:
      'Menu dégustation revisitant la gastronomie marocaine pour un comité de direction international.',
    aspectHint: 'aspect-[4/3]',
  },
  {
    id: 'mas-decor-palais',
    title: 'Architecture & Jardins Illuminés',
    category: 'Décorations',
    district: 'Anfa Supérieur',
    guests: 420,
    image: '/src/assets/images/venue_palais_anfa_1794908654717.jpg',
    description:
      'Mise en lumière complète des façades, bassins et jardins privés pour une réception nocturne.',
    aspectHint: 'aspect-[4/3]',
  },
];

const CATEGORIES: MasonryCategory[] = [
  'Toutes',
  'Mariages',
  'Décorations',
  'Soirées',
  'Événements professionnels',
];

function mapRealizationCategory(cat: string): Exclude<MasonryCategory, 'Toutes'> {
  const lower = cat.toLowerCase();
  if (lower.includes('mariage')) return 'Mariages';
  if (lower.includes('décor') || lower.includes('decor')) return 'Décorations';
  if (lower.includes('pro') || lower.includes('conf') || lower.includes('corp') || lower.includes('gala')) {
    return 'Événements professionnels';
  }
  return 'Soirées';
}

interface MasonryGalleryProps {
  variant?: 'dark' | 'light';
  extraRealizations?: RealizationItem[];
  maxItems?: number;
  headerActionLabel?: string;
  onHeaderAction?: () => void;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function MasonryGallery({
  variant = 'light',
  extraRealizations = [],
  maxItems,
  headerActionLabel,
  onHeaderAction,
  eyebrow = 'Portfolio Masonry',
  title = 'Nos réalisations d’exception à Casablanca',
  subtitle = 'Mariages prestigieux, décorations florales sur mesure, soirées privées et événements professionnels orchestrés dans les plus beaux lieux de la ville.',
}: MasonryGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<MasonryCategory>('Toutes');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const allItems = useMemo<MasonryGalleryItem[]>(() => {
    const existingImages = new Set(CURATED_MASONRY_ITEMS.map((item) => item.image));
    const customItems: MasonryGalleryItem[] = extraRealizations
      .filter((r) => r.image && !existingImages.has(r.image))
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: mapRealizationCategory(r.category),
        district: r.district || 'Casablanca',
        guests: r.guests || 150,
        image: r.image,
        description: r.description,
        aspectHint: 'aspect-[4/3]',
      }));
    return [...CURATED_MASONRY_ITEMS, ...customItems];
  }, [extraRealizations]);

  const categoryCounts = useMemo(() => {
    const counts: Record<MasonryCategory, number> = {
      Toutes: allItems.length,
      Mariages: 0,
      Décorations: 0,
      Soirées: 0,
      'Événements professionnels': 0,
    };
    for (const item of allItems) {
      counts[item.category] += 1;
    }
    return counts;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const list =
      activeCategory === 'Toutes'
        ? allItems
        : allItems.filter((item) => item.category === activeCategory);
    return typeof maxItems === 'number' && activeCategory === 'Toutes'
      ? list.slice(0, maxItems)
      : list;
  }, [activeCategory, allItems, maxItems]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) =>
          prev === null ? null : (prev + 1) % filteredItems.length
        );
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + filteredItems.length) % filteredItems.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, filteredItems.length]);

  const isDark = variant === 'dark';
  const activeItem =
    selectedIndex !== null && filteredItems[selectedIndex]
      ? filteredItems[selectedIndex]
      : null;

  return (
    <div className="space-y-8">
      {/* Header + Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          <span
            className={`text-xs font-semibold tracking-widest uppercase block ${
              isDark ? 'text-[#C9A45C]' : 'text-[#A8843E]'
            }`}
          >
            {eyebrow}
          </span>
          <TextRevealTitle
            as="h2"
            surface={isDark ? 'dark' : 'light'}
            text={title}
            className={`font-display text-3xl sm:text-4xl font-semibold ${
              isDark ? 'text-white' : 'text-[#151515]'
            }`}
          />
          {subtitle && (
            <p
              className={`text-sm leading-relaxed ${
                isDark ? 'text-white/70' : 'text-[#777777]'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {headerActionLabel && onHeaderAction && (
          <button
            type="button"
            onClick={onHeaderAction}
            className={`text-xs font-semibold transition-colors self-start md:self-auto whitespace-nowrap shrink-0 ${
              isDark
                ? 'text-[#C9A45C] hover:text-white'
                : 'text-[#151515] hover:text-[#A8843E]'
            }`}
          >
            {headerActionLabel}
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filtrer la galerie par catégorie"
        className="flex flex-wrap items-center gap-2"
      >
        {CATEGORIES.map((category) => {
          const isSelected = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setActiveCategory(category);
                setSelectedIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 inline-flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#C9A45C] text-[#151515] shadow-sm'
                  : isDark
                  ? 'bg-white/5 text-white/75 border border-white/10 hover:bg-white/10 hover:text-white'
                  : 'bg-white text-[#151515]/80 border border-[#151515]/10 hover:border-[#C9A45C] hover:text-[#151515]'
              }`}
            >
              <span>{category}</span>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  isSelected
                    ? 'text-[#151515]/75'
                    : isDark
                    ? 'text-white/45'
                    : 'text-[#777777]'
                }`}
              >
                {categoryCounts[category]}
              </span>
            </button>
          );
        })}
      </div>

      {/* True Responsive CSS Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
        {filteredItems.map((item, idx) => (
          <article
            key={item.id}
            onClick={() => setSelectedIndex(idx)}
            className={`group relative break-inside-avoid mb-5 rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 ${
              isDark
                ? 'bg-[#1D1D1D] border-white/10 hover:border-[#C9A45C]/60'
                : 'bg-white border-[#151515]/10 hover:border-[#C9A45C] shadow-sm hover:shadow-xl'
            }`}
          >
            <div className="relative w-full overflow-hidden bg-[#1D1D1D]">
              {failedImages[item.id] ? (
                <div
                  className={`${item.aspectHint} w-full bg-gradient-to-br from-[#151515] to-[#262118] flex flex-col items-center justify-center p-6 text-center`}
                >
                  <span className="font-display text-xl text-[#C9A45C]">{item.title}</span>
                  <span className="text-xs text-white/60 mt-1">{item.district}</span>
                </div>
              ) : (
                <ParallaxImage
                  src={item.image}
                  alt={item.title}
                  mode="masonry"
                  intensity={12}
                  loading="lazy"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                  }
                  className="w-full h-auto block object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              )}

              {/* Subtle Hover / Bottom Readability Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300" />

              {/* Expand Indicator */}
              <div className="absolute top-3.5 right-3.5 w-9 h-9 rounded-lg bg-black/55 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Maximize2 className="w-4 h-4" />
              </div>

              {/* Unboxed Editorial Caption */}
              <div className="absolute inset-x-0 bottom-0 p-5 space-y-1.5">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[#C9A45C] tabular-nums">
                  {item.category} · {item.district} · {item.guests} invités
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-white/75 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          onClick={() => setSelectedIndex(null)}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <button
            type="button"
            aria-label="Fermer la galerie"
            onClick={() => setSelectedIndex(null)}
            className="absolute top-5 right-5 p-3 rounded-lg bg-white/10 text-white hover:bg-[#C9A45C] hover:text-[#151515] transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {filteredItems.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) =>
                    prev === null
                      ? 0
                      : (prev - 1 + filteredItems.length) % filteredItems.length
                  );
                }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-white/10 text-white hover:bg-[#C9A45C] hover:text-[#151515] transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) =>
                    prev === null ? 0 : (prev + 1) % filteredItems.length
                  );
                }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-white/10 text-white hover:bg-[#C9A45C] hover:text-[#151515] transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full flex flex-col items-center gap-4"
          >
            <div className="relative max-h-[76vh] w-full flex items-center justify-center overflow-hidden rounded-xl bg-[#151515] border border-white/10">
              <img
                src={activeItem.image}
                alt={activeItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[76vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-white">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wider uppercase text-[#C9A45C] tabular-nums">
                  {activeItem.category} · {activeItem.district}, Casablanca ·{' '}
                  {activeItem.guests} invités
                </p>
                <h3 className="font-display text-2xl font-semibold">
                  {activeItem.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70">
                  {activeItem.description}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-white/50 shrink-0">
                {(selectedIndex ?? 0) + 1} / {filteredItems.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
