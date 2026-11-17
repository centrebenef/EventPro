import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Percent } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDH } from '../utils/pdfExport.ts';
import { TextRevealTitle } from './TextRevealTitle.tsx';
import type { CategorySlug, Provider } from '../types.ts';

type OfferFilter = 'all' | 'salles' | 'traiteurs' | 'media_son' | 'decor_org';

interface ExclusiveOffer {
  id: string;
  providerId: string;
  filterGroup: Exclude<OfferFilter, 'all'>;
  categorySlug: CategorySlug;
  categoryLabel: string;
  providerName: string;
  district: string;
  title: string;
  subtitle: string;
  validity: string;
  oldPrice: number;
  newPrice: number;
  priceSuffix: string;
  perks: string[];
  image: string;
}

const EXCLUSIVE_OFFERS: ExclusiveOffer[] = [
  {
    id: 'offer-palais-anfa',
    providerId: 'prov_salle_1',
    filterGroup: 'salles',
    categorySlug: 'salles',
    categoryLabel: 'Salles de réception',
    providerName: "Palais d'Anfa Réceptions",
    district: 'Anfa',
    title: 'Privatisation Salon Prestige & Patio',
    subtitle: 'Accès grand salon marbré, patio cocktail et voiturier pour 300 invités.',
    validity: 'Offre privilège · Dates 2026',
    oldPrice: 54000,
    newPrice: 45000,
    priceSuffix: 'par événement',
    perks: ['Patio cocktail offert', 'Prolongation jusqu’à 03h00', 'Loge mariés privée'],
    image: '/src/assets/images/venue_palais_anfa_1794908654717.jpg',
  },
  {
    id: 'offer-palais-gourmet',
    providerId: 'prov_traiteur_1',
    filterGroup: 'traiteurs',
    categorySlug: 'traiteurs',
    categoryLabel: 'Traiteurs',
    providerName: 'Maison Palais Gourmet',
    district: 'Oasis',
    title: 'Dîner Royal Marocain (Forfait 150 invités)',
    subtitle: 'Pastilla fruits de mer, méchoui fondant, pâtisseries fines et service royal.',
    validity: 'Tarif préférentiel groupe',
    oldPrice: 84000,
    newPrice: 72000,
    priceSuffix: 'pour 150 inv.',
    perks: ['480 DH / pers. au lieu de 560 DH', 'Bar à thés & jus offert', 'Dégustation préalable incluse'],
    image: '/src/assets/images/catering_moroccan_gastronomy_1794908656156.jpg',
  },
  {
    id: 'offer-studio-lumiere',
    providerId: 'prov_photo_1',
    filterGroup: 'media_son',
    categorySlug: 'photographes',
    categoryLabel: 'Photographes & Vidéastes',
    providerName: 'Studio Lumière Anfa',
    district: 'Anfa',
    title: 'Duo Reportage Photo + Film Cinéma 4K',
    subtitle: 'Couverture intégrale par 2 photographes, 2 vidéastes et plans drone certifiés.',
    validity: 'Pack Automne – Printemps',
    oldPrice: 26500,
    newPrice: 22000,
    priceSuffix: 'par prestation',
    perks: ['Teaser livré sous 48h', 'Album cuir artisanal offert', 'Plans aériens drone inclus'],
    image: '/src/assets/images/photo_couple_editorial_1794908655309.jpg',
  },
  {
    id: 'offer-floralia',
    providerId: 'prov_decor_1',
    filterGroup: 'decor_org',
    categorySlug: 'decoration',
    categoryLabel: 'Décoration',
    providerName: 'Atelier Floralia Californie',
    district: 'Californie',
    title: 'Haute Décoration & Suspension Florale',
    subtitle: 'Allée cérémonielle, 25 centres de table et espace d’honneur sur mesure.',
    validity: 'Édition limitée Casablanca',
    oldPrice: 49000,
    newPrice: 42000,
    priceSuffix: 'par événement',
    perks: ['Modélisation 3D incluse', 'Éclairage bougies & cristal', 'Équipe de 8 fleuristes'],
    image: '/src/assets/images/decor_floral_luxury_1794908655561.jpg',
  },
  {
    id: 'offer-dj-karim',
    providerId: 'prov_dj_1',
    filterGroup: 'media_son',
    categorySlug: 'dj',
    categoryLabel: 'DJ & Animation',
    providerName: 'DJ Karim & Sound Design',
    district: 'Ain Diab',
    title: 'Production Scénique & Éclairage Concert',
    subtitle: 'Sonorisation haute fidélité jusqu’à 700 invités avec régie lumière dédiée.',
    validity: 'Remise réservation anticipée',
    oldPrice: 19500,
    newPrice: 16500,
    priceSuffix: 'par soirée',
    perks: ['Étincelles froides incluses', 'Ingénieur lumière sur place', 'Micros HF conférence/discours'],
    image: '/src/assets/images/dj_gala_night_1794908656727.jpg',
  },
  {
    id: 'offer-vip-concierge',
    providerId: 'prov_org_1',
    filterGroup: 'decor_org',
    categorySlug: 'organisation',
    categoryLabel: 'Organisation complète',
    providerName: 'EVENT PRO Signature Concierge',
    district: 'Gauthier',
    title: 'Accompagnement Intégral & Formule VIP',
    subtitle: 'Direction artistique, sélection des partenaires et coordination jour J.',
    validity: 'Avantage membre EVENT PRO',
    oldPrice: 68000,
    newPrice: 58000,
    priceSuffix: 'clé en main',
    perks: ['3 coordinateurs le jour J', 'Négociation tarifs partenaires', 'Rétroplanning personnalisé'],
    image: '/src/assets/images/hero_wedding_casablanca_1794908654336.jpg',
  },
];

const FILTER_TABS: { id: OfferFilter; label: string }[] = [
  { id: 'all', label: 'Toutes les offres' },
  { id: 'salles', label: 'Salles' },
  { id: 'traiteurs', label: 'Traiteurs' },
  { id: 'media_son', label: 'Photo & DJ' },
  { id: 'decor_org', label: 'Décoration & Org' },
];

export function ExclusiveOffersSection() {
  const { providers, openBookingModal, openProviderDetail, navigate } = useApp();
  const [filter, setFilter] = useState<OfferFilter>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visibleOffers = useMemo(() => {
    if (filter === 'all') return EXCLUSIVE_OFFERS;
    return EXCLUSIVE_OFFERS.filter((o) => o.filterGroup === filter);
  }, [filter]);

  const resolveProvider = (offer: ExclusiveOffer): Provider | undefined => {
    return (
      providers.find((p) => p.id === offer.providerId) ||
      providers.find((p) => p.categorySlug === offer.categorySlug)
    );
  };

  return (
    <section
      aria-label="Exclusive Offers — Offres promotionnelles"
      className="bg-[#F7F4EF] py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header + Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-1.5">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#A8843E] block">
              Exclusive Offers
            </span>
            <TextRevealTitle
              as="h2"
              surface="light"
              text="Offres privilégiées sur nos prestations à Casablanca"
              className="font-display text-3xl sm:text-4xl font-semibold text-[#151515]"
            />
            <p className="text-sm text-[#777777] leading-relaxed">
              Tarifs négociés directement avec nos partenaires vérifiés pour vos réservations confirmées en ligne.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filtrer les offres promotionnelles"
            className="flex flex-wrap items-center gap-2"
          >
            {FILTER_TABS.map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#151515] text-[#C9A45C]'
                      : 'bg-white text-[#151515]/80 border border-[#151515]/10 hover:border-[#C9A45C] hover:text-[#151515]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleOffers.map((offer) => {
            const savings = offer.oldPrice - offer.newPrice;
            const discountPct = Math.round((savings / offer.oldPrice) * 100);
            const provider = resolveProvider(offer);

            return (
              <article
                key={offer.id}
                className="group bg-white border border-[#151515]/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#C9A45C] transition-all duration-300"
              >
                <div>
                  {/* Photographic Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1D1D1D]">
                    {failedImages[offer.id] ? (
                      <div className="w-full h-full bg-gradient-to-br from-[#1D1D1D] to-[#262118] flex items-center justify-center p-6">
                        <span className="font-display text-xl text-[#C9A45C]">
                          {offer.providerName}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={offer.image}
                        alt={offer.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [offer.id]: true }))
                        }
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    {/* Top-right discount indicator (clean square block, not pill) */}
                    <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-md bg-[#C9A45C] text-[#151515] font-mono text-xs font-bold tabular-nums inline-flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      -{discountPct}%
                    </div>

                    {/* Unboxed Bottom Scrim Caption */}
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[11px] font-medium text-[#C9A45C] tracking-wide">
                        {offer.categoryLabel} · {offer.district}
                      </p>
                      <p className="text-xs font-semibold text-white truncate mt-0.5">
                        {offer.providerName}
                      </p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-[#777777] block">
                        {offer.validity}
                      </span>
                      <h3 className="font-display text-2xl font-semibold text-[#151515] leading-snug">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-[#777777] leading-relaxed">
                        {offer.subtitle}
                      </p>
                    </div>

                    <ul className="space-y-1.5 text-xs text-[#151515]/80">
                      {offer.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#A8843E] shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pricing Comparison & Actions */}
                <div className="px-6 pb-6 pt-4 border-t border-[#151515]/10 space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-[#777777] block mb-0.5">
                        Ancien tarif
                      </span>
                      <span className="font-mono text-sm text-[#777777] line-through tabular-nums">
                        {formatDH(offer.oldPrice)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-[#A8843E] block tabular-nums">
                        Économie : -{formatDH(savings)}
                      </span>
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="font-display text-2xl sm:text-3xl font-semibold text-[#151515] tabular-nums">
                          {formatDH(offer.newPrice)}
                        </span>
                        <span className="text-[11px] text-[#777777]">
                          / {offer.priceSuffix}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (provider) {
                          openBookingModal(provider);
                        } else {
                          navigate(offer.categorySlug);
                        }
                      }}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-[#151515] text-white text-xs font-semibold hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                    >
                      Profiter de l&apos;offre
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (provider) {
                          openProviderDetail(provider);
                        } else {
                          navigate(offer.categorySlug);
                        }
                      }}
                      className="py-2.5 px-3.5 rounded-lg border border-[#151515]/15 text-[#151515] text-xs font-semibold hover:border-[#C9A45C] transition-colors whitespace-nowrap shrink-0"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
