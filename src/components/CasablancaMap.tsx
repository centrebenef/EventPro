import React, { useMemo, useState } from 'react';
import {
  Building2,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Star,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CATEGORY_LABELS, formatDH } from '../utils/pdfExport.ts';
import type { CategorySlug, Provider } from '../types.ts';

export const FEATURED_DISTRICTS = [
  'Maarif',
  'Anfa',
  'Ain Diab',
  'Bouskoura',
  'Californie',
] as const;

interface DistrictCoord {
  x: number;
  y: number;
  labelDx?: number;
  labelDy?: number;
  featured: boolean;
  subtitle: string;
}

// Normalized SVG positions (0-820 x 0-620) representing Casablanca geography
const DISTRICT_COORDS: Record<string, DistrictCoord> = {
  'Ain Diab': {
    x: 150,
    y: 175,
    labelDy: 46,
    featured: true,
    subtitle: 'Corniche & Front de mer',
  },
  Anfa: {
    x: 295,
    y: 205,
    labelDy: 46,
    featured: true,
    subtitle: 'Palais & Villas d’exception',
  },
  Bourgogne: {
    x: 380,
    y: 145,
    labelDy: 38,
    featured: false,
    subtitle: 'Gastronomie & Rives',
  },
  Gauthier: {
    x: 515,
    y: 205,
    labelDy: 38,
    featured: false,
    subtitle: 'Business & Conférences',
  },
  Maarif: {
    x: 455,
    y: 295,
    labelDy: 46,
    featured: true,
    subtitle: 'Studios, DJ & Orchestres',
  },
  Oasis: {
    x: 535,
    y: 385,
    labelDy: 38,
    featured: false,
    subtitle: 'Traiteurs & Réceptions',
  },
  Californie: {
    x: 615,
    y: 475,
    labelDy: 46,
    featured: true,
    subtitle: 'Domaines & Design floral',
  },
  'Sidi Maarouf': {
    x: 350,
    y: 485,
    labelDy: 38,
    featured: false,
    subtitle: 'Technique & Scène',
  },
  Bouskoura: {
    x: 455,
    y: 565,
    labelDy: 38,
    featured: true,
    subtitle: 'Pavillons & Forêt verte',
  },
};

export function CasablancaInteractiveMap({
  categoryFilter,
  surface = 'light',
  onSelectDistrict,
}: {
  categoryFilter?: CategorySlug | 'all';
  surface?: 'light' | 'dark';
  onSelectDistrict?: (district: string) => void;
}) {
  const { providers, openProviderDetail, openBookingModal } = useApp();
  const [activeCategory, setActiveCategory] = useState<CategorySlug | 'all'>(categoryFilter || 'all');
  const [activeDistrict, setActiveDistrict] = useState<string>('all');
  const [focusedProviderId, setFocusedProviderId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const isDarkSurface = surface === 'dark';

  // Providers matching active category (used for map pin visibility and district counts)
  const categoryMatchedProviders = useMemo(() => {
    if (activeCategory === 'all') return providers;
    return providers.filter((p) => p.categorySlug === activeCategory);
  }, [providers, activeCategory]);

  // Providers matching active category AND active district filter
  const filteredProviders = useMemo(() => {
    return categoryMatchedProviders.filter((p) => {
      if (activeDistrict !== 'all' && p.district !== activeDistrict) return false;
      return true;
    });
  }, [categoryMatchedProviders, activeDistrict]);

  // Count providers per district for map marker badges
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of categoryMatchedProviders) {
      counts[p.district] = (counts[p.district] || 0) + 1;
    }
    return counts;
  }, [categoryMatchedProviders]);

  // Compute non-overlapping pin positions around district center
  const pins = useMemo(() => {
    const counts: Record<string, number> = {};
    return filteredProviders.map((p) => {
      const base = DISTRICT_COORDS[p.district] || { x: 450, y: 300 };
      const idx = counts[p.district] || 0;
      counts[p.district] = idx + 1;
      const angle = idx * 1.65 - 0.4;
      const radius = idx === 0 ? 0 : 25 + Math.floor(idx / 3) * 14;
      return {
        provider: p,
        x: base.x + Math.cos(angle) * radius,
        y: base.y + Math.sin(angle) * radius,
      };
    });
  }, [filteredProviders]);

  const activeSelection: Provider | null = useMemo(() => {
    if (focusedProviderId) {
      const found = filteredProviders.find((p) => p.id === focusedProviderId);
      if (found) return found;
    }
    // Prefer a provider from one of the 5 featured districts on initial view
    return (
      filteredProviders.find((p) =>
        (FEATURED_DISTRICTS as readonly string[]).includes(p.district)
      ) ||
      filteredProviders[0] ||
      null
    );
  }, [focusedProviderId, filteredProviders]);

  const selectDistrict = (district: string) => {
    setActiveDistrict(district);
    onSelectDistrict?.(district);
    if (district === 'all') {
      setFocusedProviderId(null);
      return;
    }
    const inDistrict = categoryMatchedProviders.filter((p) => p.district === district);
    if (inDistrict.length > 0) {
      setFocusedProviderId(inDistrict[0].id);
    } else {
      setFocusedProviderId(null);
    }
  };

  const selectProviderPin = (provider: Provider) => {
    setFocusedProviderId(provider.id);
    if (activeDistrict !== 'all' && activeDistrict !== provider.district) {
      setActiveDistrict(provider.district);
      onSelectDistrict?.(provider.district);
    }
  };

  const districtPeers = useMemo(() => {
    if (!activeSelection) return [];
    return filteredProviders.filter((p) => p.district === activeSelection.district);
  }, [activeSelection, filteredProviders]);

  const handleSvgKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="space-y-5">
      {/* Featured Districts Quick Markers + Category Filter Bar */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isDarkSurface
            ? 'bg-white/[0.04] border-white/10'
            : 'bg-white border-[#151515]/10'
        }`}
      >
        {/* Row 1: 5 Featured Casablanca Districts */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-semibold tracking-widest uppercase mr-1 ${
                isDarkSurface ? 'text-[#C9A45C]' : 'text-[#A8843E]'
              }`}
            >
              Quartiers phares :
            </span>
            <button
              type="button"
              onClick={() => selectDistrict('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeDistrict === 'all'
                  ? 'bg-[#C9A45C] text-[#151515]'
                  : isDarkSurface
                  ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                  : 'bg-[#F7F4EF] text-[#151515]/75 hover:text-[#151515]'
              }`}
            >
              Tous ({categoryMatchedProviders.length})
            </button>
            {FEATURED_DISTRICTS.map((district) => {
              const count = districtCounts[district] || 0;
              const isSelected = activeDistrict === district;
              return (
                <button
                  key={district}
                  type="button"
                  onClick={() => selectDistrict(district)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums ${
                    isSelected
                      ? 'bg-[#C9A45C] text-[#151515]'
                      : isDarkSurface
                      ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                      : 'bg-[#F7F4EF] text-[#151515]/75 hover:text-[#151515]'
                  }`}
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  {district}
                  <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          <select
            aria-label="Filtrer par quartier de Casablanca"
            value={activeDistrict}
            onChange={(e) => selectDistrict(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border shrink-0 ${
              isDarkSurface
                ? 'bg-[#1F1F1F] border-white/15 text-white'
                : 'bg-[#F7F4EF] border-[#151515]/15 text-[#151515]'
            }`}
          >
            <option value="all">Tous les quartiers de Casablanca</option>
            {Object.keys(DISTRICT_COORDS).map((d) => (
              <option key={d} value={d}>
                {d} ({districtCounts[d] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Category Filters */}
        <div
          className={`pt-3 border-t flex flex-wrap items-center gap-1.5 ${
            isDarkSurface ? 'border-white/10' : 'border-[#151515]/10'
          }`}
        >
          {[
            { id: 'all', label: 'Tous les métiers' },
            { id: 'salles', label: 'Salles' },
            { id: 'photographes', label: 'Photographes' },
            { id: 'traiteurs', label: 'Traiteurs' },
            { id: 'dj', label: 'DJ & Animation' },
            { id: 'decoration', label: 'Décoration' },
            { id: 'organisation', label: 'Organisation' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id as CategorySlug | 'all');
                setFocusedProviderId(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === tab.id
                  ? isDarkSurface
                    ? 'bg-white text-[#151515]'
                    : 'bg-[#151515] text-white'
                  : isDarkSurface
                  ? 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                  : 'bg-[#F7F4EF] text-[#151515]/75 hover:text-[#151515]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map + Provider Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive SVG Map of Casablanca */}
        <div
          className={`lg:col-span-7 bg-[#111111] rounded-2xl overflow-hidden border relative min-h-[440px] flex flex-col justify-between ${
            isDarkSurface ? 'border-[#C9A45C]/25' : 'border-[#151515]/15'
          }`}
        >
          <svg
            viewBox="0 0 820 620"
            className="w-full h-full select-none flex-1"
            role="img"
            aria-label="Carte interactive des prestataires événementiels à Casablanca : Maarif, Anfa, Ain Diab, Bouskoura et Californie"
          >
            <defs>
              <radialGradient id="oceanGlow" cx="18%" cy="15%" r="48%">
                <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.88" />
              </radialGradient>
              <pattern id="casaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.03"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Architectural Urban Grid */}
            <rect width="820" height="620" fill="url(#casaGrid)" />

            {/* Atlantic Ocean Coastline */}
            <path
              d="M0 0 L435 0 Q350 75 215 108 Q105 135 60 275 L0 375 Z"
              fill="url(#oceanGlow)"
            />
            <path
              d="M435 0 Q350 75 215 108 Q105 135 60 275 L0 375"
              fill="none"
              stroke="#C9A45C"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
            <text
              x="54"
              y="62"
              fill="#C9A45C"
              fontSize="12"
              fontWeight="600"
              letterSpacing="2.5"
              opacity="0.85"
            >
              OCÉAN ATLANTIQUE
            </text>

            {/* Primary Casablanca Boulevards */}
            <g stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth="1.5">
              <path d="M125 170 Q340 185 570 215" fill="none" />
              <path d="M250 130 L585 495" fill="none" />
              <path d="M165 295 L690 295" fill="none" />
              <path d="M385 115 L455 595" fill="none" />
              <path d="M185 415 Q435 435 690 390" fill="none" />
              <path d="M295 205 L455 295 L615 475" fill="none" strokeDasharray="4 4" strokeOpacity="0.16" />
            </g>

            {/* Geographic Orientation Labels */}
            <text x="530" y="112" fill="#FFFFFF" opacity="0.28" fontSize="10" letterSpacing="1.5">
              CORNICHE &amp; BOULEVARD D&apos;ANFA
            </text>
            <text x="565" y="575" fill="#FFFFFF" opacity="0.28" fontSize="10" letterSpacing="1.5">
              FORÊT DE BOUSKOURA
            </text>

            {/* District Markers (Maarif, Anfa, Ain Diab, Bouskoura, Californie + secondary) */}
            {Object.entries(DISTRICT_COORDS).map(([name, pos]) => {
              const isSelected = activeDistrict === name;
              const isActiveProviderDistrict = activeSelection?.district === name;
              const count = districtCounts[name] || 0;
              const highlighted = isSelected || isActiveProviderDistrict;

              return (
                <g
                  key={name}
                  role="button"
                  tabIndex={0}
                  aria-label={`Quartier ${name}, ${count} prestataires`}
                  onClick={() => selectDistrict(isSelected ? 'all' : name)}
                  onKeyDown={(e) =>
                    handleSvgKeyDown(e, () => selectDistrict(isSelected ? 'all' : name))
                  }
                  className="cursor-pointer focus:outline-none"
                >
                  {/* Subtle Halo Zone */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={highlighted ? 44 : pos.featured ? 36 : 26}
                    fill={highlighted ? '#C9A45C' : '#FFFFFF'}
                    fillOpacity={highlighted ? 0.16 : pos.featured ? 0.06 : 0.03}
                    stroke="#C9A45C"
                    strokeWidth={highlighted ? 1.5 : 1}
                    strokeOpacity={highlighted ? 0.9 : pos.featured ? 0.45 : 0.2}
                    strokeDasharray={highlighted ? undefined : '3 3'}
                  />

                  {/* Featured District Architectural Marker */}
                  {pos.featured && (
                    <g transform={`translate(${pos.x}, ${pos.y})`}>
                      <circle
                        r={highlighted ? 7 : 5}
                        fill={highlighted ? '#C9A45C' : '#151515'}
                        stroke="#C9A45C"
                        strokeWidth="2"
                      />
                    </g>
                  )}

                  {/* District Label Pill inside SVG */}
                  <g transform={`translate(${pos.x}, ${pos.y + (pos.labelDy || 42)})`}>
                    <rect
                      x={-54}
                      y={-12}
                      width={108}
                      height={22}
                      rx={6}
                      fill={highlighted ? '#C9A45C' : '#151515'}
                      fillOpacity={highlighted ? 1 : 0.85}
                      stroke="#C9A45C"
                      strokeOpacity={highlighted ? 1 : pos.featured ? 0.45 : 0.2}
                      strokeWidth="1"
                    />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fill={highlighted ? '#151515' : '#F7F4EF'}
                      fontSize={pos.featured ? '11' : '10'}
                      fontWeight={pos.featured || highlighted ? '700' : '500'}
                    >
                      {name} · {count}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Provider Pins */}
            {pins.map(({ provider, x, y }) => {
              const selected = activeSelection?.id === provider.id;
              const hovered = hoveredPinId === provider.id;
              return (
                <g
                  key={provider.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${provider.name}, ${CATEGORY_LABELS[provider.categorySlug]} à ${provider.district}`}
                  transform={`translate(${x}, ${y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectProviderPin(provider);
                  }}
                  onKeyDown={(e) =>
                    handleSvgKeyDown(e, () => selectProviderPin(provider))
                  }
                  onMouseEnter={() => setHoveredPinId(provider.id)}
                  onMouseLeave={() => setHoveredPinId(null)}
                  className="cursor-pointer focus:outline-none"
                >
                  {selected && (
                    <circle
                      r={20}
                      fill="none"
                      stroke="#C9A45C"
                      strokeWidth="1.5"
                      strokeOpacity="0.85"
                    />
                  )}
                  <circle
                    r={selected ? 13 : hovered ? 11 : 9}
                    fill={selected ? '#C9A45C' : '#FFFFFF'}
                    stroke="#151515"
                    strokeWidth="2.5"
                  />
                  <circle r={3.5} fill="#151515" />

                  {(hovered || selected) && (
                    <g transform="translate(0, -24)">
                      <rect
                        x={-88}
                        y={-15}
                        width={176}
                        height={20}
                        rx={5}
                        fill="#151515"
                        stroke="#C9A45C"
                        strokeOpacity="0.65"
                        strokeWidth="1"
                      />
                      <text
                        x={0}
                        y={-2}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {provider.name.length > 26
                          ? `${provider.name.slice(0, 24)}…`
                          : provider.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Top Left Counter & Legend */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="bg-[#151515]/90 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2 text-xs text-white flex items-center gap-2 pointer-events-auto">
              <Navigation className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
              <span className="tabular-nums">
                {filteredProviders.length} prestataire{filteredProviders.length > 1 ? 's' : ''}{' '}
                {activeDistrict === 'all' ? 'à Casablanca' : `à ${activeDistrict}`}
              </span>
            </div>

            <div className="bg-[#151515]/90 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-1.5 text-[11px] text-white/80 hidden sm:flex items-center gap-3 pointer-events-auto">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A45C] inline-block" />
                Sélectionné
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
                Prestataire
              </span>
            </div>
          </div>
        </div>

        {/* Right: Provider Detail Card ("Fiche prestataire") */}
        <div
          className={`lg:col-span-5 rounded-2xl p-6 flex flex-col justify-between border ${
            isDarkSurface
              ? 'bg-white text-[#151515] border-[#C9A45C]/30 shadow-2xl'
              : 'bg-white text-[#151515] border-[#151515]/10'
          }`}
        >
          {activeSelection ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Photo with graceful fallback */}
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#EFEAE1] relative">
                  {activeSelection.gallery[0] && !failedImages[activeSelection.id] ? (
                    <img
                      src={activeSelection.gallery[0]}
                      alt={activeSelection.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [activeSelection.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#777777] gap-2">
                      <Building2 className="w-8 h-8 text-[#C9A45C]" />
                      <span className="text-xs font-medium">{activeSelection.district}</span>
                    </div>
                  )}
                </div>

                {/* Category + District (zero-pill inline hierarchy) */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#A8843E]">
                    <span>{CATEGORY_LABELS[activeSelection.categorySlug]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeSelection.subCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-[#151515]">
                      <MapPin className="w-3.5 h-3.5 text-[#C9A45C]" />
                      {activeSelection.district}
                    </span>
                  </div>

                  {/* Provider Name */}
                  <h3 className="font-display text-2xl font-semibold text-[#151515] mt-1.5">
                    {activeSelection.name}
                  </h3>
                  <p className="text-sm text-[#151515]/75 leading-relaxed mt-1.5">
                    {activeSelection.shortBio}
                  </p>
                </div>

                {/* Coordonnées complètes du prestataire */}
                <div className="bg-[#F7F4EF] border border-[#151515]/10 rounded-xl p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#A8843E]">
                    Coordonnées du prestataire
                  </p>

                  <div className="flex items-start gap-2.5 text-xs text-[#151515]">
                    <MapPin className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                    <span>{activeSelection.address}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 pt-0.5">
                    <a
                      href={`tel:${activeSelection.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#151515] hover:text-[#A8843E] transition-colors tabular-nums"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                      {activeSelection.phone}
                    </a>
                    <a
                      href={`mailto:${activeSelection.email}`}
                      className="inline-flex items-center gap-2 text-xs font-medium text-[#151515]/80 hover:text-[#A8843E] transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                      <span className="truncate">{activeSelection.email}</span>
                    </a>
                  </div>
                </div>

                {/* District Peer Switcher (if multiple providers in same district) */}
                {districtPeers.length > 1 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-[#777777]">
                      Autres prestataires à {activeSelection.district} :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {districtPeers.map((peer) => {
                        const isCurrent = peer.id === activeSelection.id;
                        return (
                          <button
                            key={peer.id}
                            type="button"
                            onClick={() => setFocusedProviderId(peer.id)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                              isCurrent
                                ? 'bg-[#151515] text-white border-[#151515]'
                                : 'bg-white text-[#151515]/80 border-[#151515]/15 hover:border-[#151515]'
                            }`}
                          >
                            {peer.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Price + Rating + Actions */}
              <div className="space-y-4 pt-3 border-t border-[#151515]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#777777] block">Tarif indicatif</span>
                    <span className="font-mono text-lg font-bold text-[#151515] tabular-nums">
                      À partir de {formatDH(activeSelection.priceFrom)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-[#151515] tabular-nums">
                    <Star className="w-4 h-4 text-[#C9A45C] fill-[#C9A45C]" />
                    {activeSelection.rating.toFixed(1)}
                    <span className="text-xs font-normal text-[#777777]">
                      ({activeSelection.reviewCount})
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => openProviderDetail(activeSelection)}
                    className="py-2.5 px-3 text-xs font-semibold border border-[#151515]/20 rounded-lg hover:border-[#151515] transition-colors whitespace-nowrap shrink-0"
                  >
                    Voir la fiche
                  </button>
                  <button
                    type="button"
                    onClick={() => openBookingModal(activeSelection)}
                    className="py-2.5 px-3 text-xs font-semibold bg-[#151515] text-white rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors whitespace-nowrap shrink-0"
                  >
                    Réserver
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#777777] text-center p-6">
              Aucun prestataire ne correspond à ce filtre dans ce quartier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
