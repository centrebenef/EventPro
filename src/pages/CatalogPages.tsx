import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ProviderCard } from '../components/ProviderCard.tsx';
import { CasablancaInteractiveMap } from '../components/CasablancaMap.tsx';
import { CASABLANCA_DISTRICTS, CATEGORY_LABELS, EVENT_TYPES, formatDH } from '../utils/pdfExport.ts';
import type { CategorySlug, Provider } from '../types.ts';

const SUBCATEGORY_OPTIONS: Record<CategorySlug | 'all', string[]> = {
  all: [],
  salles: [
    'Salles de mariage',
    'Salles de fêtes',
    'Hôtels',
    'Jardins et espaces extérieurs',
    'Salles de conférence',
    'Espaces privés',
  ],
  photographes: [
    'Photographie de mariage',
    'Photographie de fiançailles',
    'Photographie d\'anniversaire',
    'Vidéographie',
    'Shooting professionnel',
    'Photobooth',
    'Vidéo cinéma et drone',
  ],
  traiteurs: [
    'Traiteur marocain',
    'Traiteur international',
    'Buffet',
    'Cocktail',
    'Pâtisserie',
    'Wedding cake',
    'Cuisine traditionnelle',
    'Cuisine gastronomique',
  ],
  dj: [
    'DJ professionnels',
    'Groupes musicaux',
    'Musique traditionnelle marocaine',
    'Animation de mariage',
    'Animation pour enfants',
    'Sonorisation',
    'Éclairage professionnel',
    'Spectacles et artistes',
  ],
  decoration: [
    'Décoration de mariage',
    'Décoration de fiançailles',
    'Décoration florale',
    'Décoration de tables',
    'Décoration de salles',
    'Décoration d\'anniversaire',
    'Décoration de cérémonies',
    'Décoration d\'événements d\'entreprise',
  ],
  organisation: ['Organisation complète'],
};

const PAGE_HEADERS: Record<
  CategorySlug | 'prestations',
  { kicker: string; title: string; subtitle: string }
> = {
  prestations: {
    kicker: 'Catalogue complet',
    title: 'Nos prestataires événementiels à Casablanca',
    subtitle: 'Recherchez, filtrez et comparez les meilleurs professionnels sélectionnés par EVENT PRO.',
  },
  salles: {
    kicker: 'Lieux d\'exception',
    title: 'Salles de réception à Casablanca',
    subtitle: 'Palais d\'apparat, hôtels 5 étoiles, villas avec jardins et espaces de conférence dans les meilleurs quartiers.',
  },
  photographes: {
    kicker: 'Image & Cinéma',
    title: 'Photographes et vidéastes professionnels',
    subtitle: 'Immortalisez vos moments avec des reportages éditoriaux, films cinéma 4K, drones et photobooths.',
  },
  traiteurs: {
    kicker: 'Haute Gastronomie',
    title: 'Traiteurs et pâtisserie événementielle',
    subtitle: 'Cuisine marocaine royale, menus gastronomiques internationaux, cocktails dînatoires et wedding cakes.',
  },
  dj: {
    kicker: 'Musique & Scénographie',
    title: 'DJ, orchestres & animation',
    subtitle: 'DJ sets, orchestres andalous, Dakka Marrakchia, sonorisation concert et éclairage architectural.',
  },
  decoration: {
    kicker: 'Design Floral & Spatial',
    title: 'Décoration événementielle sur mesure',
    subtitle: 'Arches florales, arts de la table, scénographies lumineuses pour mariages et événements d\'entreprise.',
  },
  organisation: {
    kicker: 'Chef de Projet Dédié',
    title: 'Organisation complète d\'événements',
    subtitle: 'Confiez l\'orchestration intégrale de votre mariage, séminaire ou gala à nos organisateurs certifiés.',
  },
};

export function CatalogPage({ mode }: { mode: CategorySlug | 'prestations' }) {
  const { searchPreset, siteContent, providers, openQuoteModal, navigate } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<CategorySlug | 'all'>(
    mode === 'prestations' ? 'all' : mode
  );
  const [subCategory, setSubCategory] = useState('all');
  const [district, setDistrict] = useState(searchPreset.district || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minGuests, setMinGuests] = useState<number>(searchPreset.guests || 0);
  const [maxBudget, setMaxBudget] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState(searchPreset.date || '');
  const [showMap, setShowMap] = useState(false);

  const [filteredProviders, setFilteredProviders] = useState<Provider[]>(providers);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCategoryFilter(mode === 'prestations' ? 'all' : mode);
    setSubCategory('all');
  }, [mode]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (subCategory !== 'all') params.set('subCategory', subCategory);
    if (district !== 'all') params.set('district', district);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (minGuests > 0) params.set('minCapacity', String(minGuests));
    if (maxBudget > 0) params.set('maxBudget', String(maxBudget));
    if (dateFilter) params.set('date', dateFilter);

    setLoading(true);
    fetch(`/api/providers?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setFilteredProviders(d.providers || []))
      .finally(() => setLoading(false));
  }, [categoryFilter, subCategory, district, searchTerm, minGuests, maxBudget, dateFilter]);

  const header = PAGE_HEADERS[mode];
  const subCategories = useMemo(
    () => (categoryFilter === 'all' ? [] : SUBCATEGORY_OPTIONS[categoryFilter] || []),
    [categoryFilter]
  );

  const orgProvider = providers.find((p) => p.categorySlug === 'organisation') || providers[0];

  return (
    <div className="bg-[#F7F4EF] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#151515]/10 pb-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
              {header.kicker}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#151515]">
              {header.title}
            </h1>
            <p className="text-sm sm:text-base text-[#777777]">{header.subtitle}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-2 transition-colors ${
                showMap
                  ? 'bg-[#151515] text-white border-[#151515]'
                  : 'bg-white text-[#151515] border-[#151515]/20 hover:border-[#151515]'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#C9A45C]" />
              {showMap ? 'Vue Grille' : 'Carte Interactive'}
            </button>
            <button
              type="button"
              onClick={() => navigate('event-builder')}
              className="px-4 py-2.5 bg-[#C9A45C] text-[#151515] rounded-lg text-xs font-semibold hover:bg-[#151515] hover:text-white transition-colors"
            >
              Event Builder
            </button>
          </div>
        </div>

        {/* Dedicated Organisation Complète Packages (when mode === 'organisation') */}
        {mode === 'organisation' && siteContent && (
          <div className="space-y-8">
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Types d&apos;événements pris en charge
              </h2>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((ev) => (
                  <span
                    key={ev}
                    className="px-3.5 py-2 rounded-lg bg-[#F7F4EF] border border-[#151515]/10 text-xs font-medium text-[#151515]"
                  >
                    {ev}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {siteContent.plannerPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-2xl p-6 border flex flex-col justify-between space-y-6 ${
                    pkg.id === 'vip'
                      ? 'bg-[#151515] text-white border-[#C9A45C]'
                      : 'bg-white text-[#151515] border-[#151515]/10'
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A45C]">
                        Accompagnement
                      </span>
                      <h3 className="font-display text-3xl font-semibold mt-1">{pkg.name}</h3>
                      <p className={`text-xs mt-1 ${pkg.id === 'vip' ? 'text-white/70' : 'text-[#777777]'}`}>
                        {pkg.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-current/10">
                      <span className="font-mono text-3xl font-bold tabular-nums">
                        {formatDH(pkg.price)}
                      </span>
                      <span className={`text-xs ml-1.5 ${pkg.id === 'vip' ? 'text-white/60' : 'text-[#777777]'}`}>
                        forfait
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-sm">
                      {pkg.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => orgProvider && openQuoteModal(orgProvider)}
                    className={`w-full py-3 rounded-lg text-xs font-semibold transition-colors ${
                      pkg.id === 'vip'
                        ? 'bg-[#C9A45C] text-[#151515] hover:bg-white'
                        : 'bg-[#151515] text-white hover:bg-[#C9A45C] hover:text-[#151515]'
                    }`}
                  >
                    Choisir la {pkg.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Filter Bar */}
        <div className="bg-white border border-[#151515]/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#151515]">
            <SlidersHorizontal className="w-4 h-4 text-[#C9A45C]" />
            <span>Filtres dynamiques</span>
          </div>

          {/* Category segmented tabs when viewing all prestations */}
          {mode === 'prestations' && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSubCategory('all');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-[#151515] text-white'
                    : 'bg-[#F7F4EF] text-[#151515]/75 hover:text-[#151515]'
                }`}
              >
                Toutes
              </button>
              {(Object.keys(CATEGORY_LABELS) as CategorySlug[]).map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(slug);
                    setSubCategory('all');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    categoryFilter === slug
                      ? 'bg-[#151515] text-white'
                      : 'bg-[#F7F4EF] text-[#151515]/75 hover:text-[#151515]'
                  }`}
                >
                  {CATEGORY_LABELS[slug]}
                </button>
              ))}
            </div>
          )}

          {/* Subcategory filter buttons */}
          {subCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSubCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  subCategory === 'all'
                    ? 'bg-[#C9A45C] text-[#151515] border-[#C9A45C] font-semibold'
                    : 'bg-white border-[#151515]/15 text-[#777777] hover:text-[#151515]'
                }`}
              >
                Tout voir
              </button>
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubCategory(sub)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    subCategory === sub
                      ? 'bg-[#C9A45C] text-[#151515] border-[#C9A45C] font-semibold'
                      : 'bg-white border-[#151515]/15 text-[#777777] hover:text-[#151515]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
              />
            </div>

            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
            >
              <option value="all">Tous les quartiers</option>
              {CASABLANCA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Disponibilité à cette date"
              className="px-3 py-2 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
            />

            <select
              value={minGuests}
              onChange={(e) => setMinGuests(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
            >
              <option value={0}>Capacité / Invités : Tous</option>
              <option value={50}>50+ invités</option>
              <option value={150}>150+ invités</option>
              <option value={300}>300+ invités</option>
              <option value={500}>500+ invités</option>
            </select>

            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
            >
              <option value={0}>Budget max : Illimité</option>
              <option value={10000}>Jusqu&apos;à 10 000 DH</option>
              <option value={25000}>Jusqu&apos;à 25 000 DH</option>
              <option value={45000}>Jusqu&apos;à 45 000 DH</option>
              <option value={75000}>Jusqu&apos;à 75 000 DH</option>
            </select>
          </div>
        </div>

        {/* Map or Grid Results */}
        {showMap ? (
          <CasablancaInteractiveMap
            categoryFilter={categoryFilter}
            onSelectDistrict={(d) => setDistrict(d)}
          />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 bg-white/60 rounded-xl animate-pulse border border-[#151515]/10" />
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="bg-white border border-[#151515]/10 rounded-2xl p-12 text-center space-y-3">
            <h3 className="font-display text-2xl font-semibold text-[#151515]">
              Aucun prestataire disponible pour ces critères
            </h3>
            <p className="text-sm text-[#777777]">
              Essayez d&apos;élargir votre budget, de changer de quartier ou de sélectionner une autre date.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubCategory('all');
                setDistrict('all');
                setSearchTerm('');
                setMinGuests(0);
                setMaxBudget(0);
                setDateFilter('');
              }}
              className="px-5 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
