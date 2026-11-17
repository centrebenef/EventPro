import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ProviderCard } from '../components/ProviderCard.tsx';
import { PremiumStatsSection } from '../components/PremiumStatsSection.tsx';
import { MasonryGallery } from '../components/MasonryGallery.tsx';
import { VenuesCarouselSection } from '../components/VenuesCarouselSection.tsx';
import { ExploreByExperienceSection } from '../components/ExploreByExperienceSection.tsx';
import { MyDreamEventSection } from '../components/MyDreamEventSection.tsx';
import { ExclusiveOffersSection } from '../components/ExclusiveOffersSection.tsx';
import { ClientLoveStoriesSection } from '../components/ClientLoveStoriesSection.tsx';
import { EventTimelineSection } from '../components/EventTimelineSection.tsx';
import { BeforeAfterGallerySection } from '../components/BeforeAfterGallerySection.tsx';
import { DiscoverCasablancaSection } from '../components/DiscoverCasablancaSection.tsx';
import { TextRevealTitle } from '../components/TextRevealTitle.tsx';
import { ParallaxImage } from '../components/ParallaxImage.tsx';
import { CASABLANCA_DISTRICTS, EVENT_TYPES } from '../utils/pdfExport.ts';
import type { AppPage } from '../types.ts';

const IMG_HERO = '/src/assets/images/hero_wedding_casablanca_1794908654336.jpg';

export function HomePage() {
  const { providers, siteContent, navigate, showToast } = useApp();

  const [searchEventType, setSearchEventType] = useState('Mariage');
  const [searchCategory, setSearchCategory] = useState<string>('prestations');
  const [searchDistrict, setSearchDistrict] = useState('all');
  const [searchDate, setSearchDate] = useState('');
  const [searchGuests, setSearchGuests] = useState(150);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);

  const popularProviders = providers.filter((p) => p.featured).slice(0, 6);
  const displayProviders = popularProviders.length > 0 ? popularProviders : providers.slice(0, 6);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = (searchCategory as AppPage) || 'prestations';
    navigate(targetPage, {
      eventType: searchEventType,
      category: searchCategory,
      district: searchDistrict,
      date: searchDate,
      guests: searchGuests,
    });
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterBusy(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Inscription confirmée !', 'success');
        setNewsletterEmail('');
      } else {
        showToast(data.error || 'Erreur lors de l\'inscription.', 'error');
      }
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
    <div className="bg-[#F7F4EF]">
      {/* Optional Promo Banner */}
      {siteContent?.promoBanner && (
        <div className="bg-[#151515] text-[#F7F4EF] text-xs py-2.5 px-4 text-center border-b border-[#C9A45C]/30">
          <span className="text-[#C9A45C] font-semibold mr-2">Casablanca ·</span>
          <span>{siteContent.promoBanner}</span>
        </div>
      )}

      {/* SECTION 1: HERO */}
      <section className="relative bg-[#151515] text-white overflow-hidden">
        <div className="absolute inset-0">
          <ParallaxImage
            src={IMG_HERO}
            alt="Réception de mariage de luxe à Casablanca"
            intensity={42}
            wrapperClassName="w-full h-full"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/60 to-[#151515]/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-28 space-y-12">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A45C]">
              Casablanca · Chaque événement mérite d&apos;être exceptionnel
            </p>
            <TextRevealTitle
              as="h1"
              immediate
              surface="dark"
              text={
                siteContent?.heroTitle ||
                'Organisez vos événements, nous créons vos plus beaux souvenirs.'
              }
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] text-white"
            />
            <p className="text-base sm:text-lg text-white/85 max-w-2xl leading-relaxed">
              {siteContent?.heroSubtitle ||
                'Trouvez les meilleurs prestataires événementiels à Casablanca et organisez facilement vos événements avec EVENT PRO.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('prestations')}
                className="px-6 py-3.5 bg-[#C9A45C] text-[#151515] text-sm font-semibold rounded-lg hover:bg-white transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                Découvrir nos prestations
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('event-builder')}
                className="px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white border border-white/25 text-sm font-semibold rounded-lg hover:bg-white hover:text-[#151515] transition-colors whitespace-nowrap shrink-0"
              >
                Créer mon événement
              </button>
            </div>
          </div>

          {/* Modern 5-Criteria Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-white text-[#151515] rounded-2xl p-4 sm:p-5 shadow-2xl border border-[#151515]/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-semibold text-[#777777] mb-1">
                Type d&apos;événement
              </label>
              <select
                value={searchEventType}
                onChange={(e) => setSearchEventType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#777777] mb-1">
                Catégorie de prestation
              </label>
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
              >
                <option value="prestations">Toutes les catégories</option>
                <option value="salles">Salles de réception</option>
                <option value="photographes">Photographes &amp; Vidéastes</option>
                <option value="traiteurs">Traiteurs</option>
                <option value="dj">DJ &amp; Animation</option>
                <option value="decoration">Décoration</option>
                <option value="organisation">Organisation complète</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#777777] mb-1">
                Quartier (Casablanca)
              </label>
              <select
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
              >
                <option value="all">Tous les quartiers</option>
                {CASABLANCA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#777777] mb-1">
                Date souhaitée
              </label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#777777] mb-1">
                Nombre d&apos;invités
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                value={searchGuests}
                onChange={(e) => setSearchGuests(Number(e.target.value) || 50)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#151515]/15 text-sm bg-[#F7F4EF] tabular-nums"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center justify-center gap-2 h-[42px]"
            >
              <Search className="w-4 h-4" />
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* SECTION 2: EXPLORE BY EXPERIENCE (6 large photographic hover cards) */}
      <ExploreByExperienceSection />

      {/* SECTION 2.5: CARROUSEL HORIZONTAL DES SALLES DE RÉCEPTION */}
      <VenuesCarouselSection />

      {/* SECTION 3: PRESTATAIRES POPULAIRES */}
      <section className="bg-white border-y border-[#151515]/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
                Sélection Casablanca
              </span>
              <TextRevealTitle
                as="h2"
                surface="light"
                text="Prestataires populaires et vérifiés"
                className="font-display text-3xl sm:text-4xl font-semibold text-[#151515] mt-1"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('prestations')}
              className="px-5 py-2.5 border border-[#151515]/20 rounded-lg text-xs font-semibold hover:border-[#151515] transition-colors self-start md:self-auto"
            >
              Voir tout le catalogue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3.25: EXCLUSIVE OFFERS — OFFRES PROMOTIONNELLES */}
      <ExclusiveOffersSection />

      {/* SECTION 3.5: STATISTIQUES PREMIUM */}
      <PremiumStatsSection />

      {/* SECTION 4: COMMENT ÇA MARCHE ? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
            Méthode
          </span>
          <TextRevealTitle
            as="h2"
            surface="light"
            text="Comment ça marche ?"
            className="font-display text-3xl sm:text-4xl font-semibold text-[#151515] mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: '01.',
              title: 'Choisissez votre événement',
              desc: 'Définissez votre type de réception, votre date, votre quartier à Casablanca et votre nombre d\'invités.',
            },
            {
              num: '02.',
              title: 'Découvrez les meilleurs prestataires',
              desc: 'Parcourez des fiches complètes avec portfolios, menus, équipements et disponibilités en temps réel.',
            },
            {
              num: '03.',
              title: 'Comparez les offres et les tarifs',
              desc: 'Utilisez notre comparateur et l\'Event Builder pour maîtriser votre budget en Dirhams (DH).',
            },
            {
              num: '04.',
              title: 'Réservez vos prestations',
              desc: 'Validez en ligne sans double réservation, recevez votre numéro unique et suivez tout depuis votre espace.',
            },
          ].map((step) => (
            <div
              key={step.num}
              className="bg-white border border-[#151515]/10 rounded-xl p-6 space-y-3"
            >
              <span className="font-display text-3xl font-semibold text-[#C9A45C] block">
                {step.num}
              </span>
              <h3 className="font-display text-xl font-semibold text-[#151515]">{step.title}</h3>
              <p className="text-sm text-[#777777] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => navigate('event-builder')}
            className="px-6 py-3.5 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
          >
            Lancer l&apos;Event Builder étape par étape
          </button>
        </div>
      </section>

      {/* SECTION 4.5: MY DREAM EVENT — CONFIGURATEUR INTERACTIF */}
      <MyDreamEventSection />

      {/* SECTION 4.75: EVENT TIMELINE — FRISE CHRONOLOGIQUE ANIMÉE */}
      <EventTimelineSection />

      {/* SECTION 5: GALERIE MASONRY — NOS RÉALISATIONS */}
      <section className="bg-[#151515] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MasonryGallery
            variant="dark"
            extraRealizations={siteContent?.realizations || []}
            maxItems={9}
            eyebrow="Portfolio Masonry"
            title="Nos réalisations à Casablanca"
            subtitle="Explorez nos mariages prestigieux, décorations florales, soirées privées et événements professionnels orchestrés sur mesure."
            headerActionLabel="Voir toute la galerie →"
            onHeaderAction={() => navigate('realisations')}
          />
        </div>
      </section>

      {/* SECTION 5.5: GALERIE BEFORE & AFTER — TRANSFORMATION DE SALLES */}
      <BeforeAfterGallerySection />

      {/* SECTION 6: POURQUOI CHOISIR EVENT PRO ? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="space-y-4">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
              Engagements
            </span>
            <TextRevealTitle
              as="h2"
              surface="light"
              text="Pourquoi choisir EVENT PRO ?"
              className="font-display text-3xl sm:text-4xl font-semibold text-[#151515]"
            />
            <p className="text-sm text-[#777777] leading-relaxed">
              Une architecture commerciale pensée pour offrir aux particuliers exigeants et aux
              entreprises casablancaises une exécution sans friction.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: 'Prestataires sélectionnés',
                desc: 'Chaque professionnel est audité et approuvé par notre équipe avant sa mise en ligne.',
              },
              {
                icon: CalendarCheck,
                title: 'Réservation simplifiée',
                desc: 'Vérification des disponibilités en direct pour empêcher toute double réservation.',
              },
              {
                icon: Award,
                title: 'Tarifs transparents en DH',
                desc: 'Formules détaillées, prix affichés et génération instantanée de devis PDF.',
              },
              {
                icon: Layers,
                title: 'Toutes vos prestations réunies',
                desc: 'Salles, traiteurs, photographes, DJ, décoration et planification sur un portail unique.',
              },
              {
                icon: UserCheck,
                title: 'Accompagnement personnalisé',
                desc: 'Conseillers humains dédiés et assistant intelligent EVENT AI disponible 24h/24.',
              },
              {
                icon: Clock,
                title: 'Gain de temps considérable',
                desc: 'Comparez et composez l\'intégralité de votre réception en quelques minutes.',
              },
            ].map((adv) => (
              <div
                key={adv.title}
                className="bg-white border border-[#151515]/10 rounded-xl p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F7F4EF] border border-[#C9A45C]/40 flex items-center justify-center shrink-0">
                  <adv.icon className="w-5 h-5 text-[#A8843E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#151515] mb-1">{adv.title}</h3>
                  <p className="text-xs text-[#777777] leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6.5: DISCOVER CASABLANCA — CARTE INTERACTIVE PAR QUARTIER */}
      <DiscoverCasablancaSection />

      {/* SECTION 7: CLIENT LOVE STORIES */}
      <ClientLoveStoriesSection />

      {/* SECTION 8: NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-[#151515] text-white rounded-2xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#C9A45C]">
              Cercle Privé EVENT PRO
            </span>
            <TextRevealTitle
              as="h2"
              surface="dark"
              text="Recevez nos adresses confidentielles à Casablanca"
              className="font-display text-3xl font-semibold"
            />
            <p className="text-sm text-white/75">
              Nouveaux lieux d&apos;exception, tendances scénographiques et créneaux privilégiés.
            </p>
          </div>

          <form onSubmit={handleNewsletter} className="relative z-10 w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Entrez votre adresse email"
              className="w-full sm:w-72 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#C9A45C]"
            />
            <button
              type="submit"
              disabled={newsletterBusy}
              className="px-6 py-3 bg-[#C9A45C] text-[#151515] font-semibold text-sm rounded-lg hover:bg-white transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              {newsletterBusy ? 'Envoi...' : 'S\'inscrire'}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
