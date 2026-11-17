import React, { useState } from 'react';
import { ChevronDown, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CasablancaInteractiveMap } from '../components/CasablancaMap.tsx';
import { MasonryGallery } from '../components/MasonryGallery.tsx';
import type { AppPage } from '../types.ts';

export function ExtraPage({ page }: { page: AppPage }) {
  const { siteContent, navigate, showToast } = useApp();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Organisation de mariage',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (res.ok) {
        showToast('Votre message a bien été transmis à notre équipe à Casablanca.', 'success');
        setContactForm({ name: '', email: '', phone: '', subject: 'Organisation de mariage', message: '' });
      } else {
        const d = await res.json();
        showToast(d.error || 'Erreur lors de l\'envoi.', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  if (page === 'carte') {
    return (
      <div className="bg-[#F7F4EF] min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
              Géolocalisation Casablanca
            </span>
            <h1 className="font-display text-4xl font-semibold text-[#151515] mt-1">
              Carte interactive des prestataires
            </h1>
            <p className="text-sm text-[#777777] mt-1">
              Explorez nos partenaires répartis entre Anfa, Ain Diab, Maarif, Gauthier, Californie, Oasis, Bourgogne, Sidi Maarouf et Bouskoura.
            </p>
          </div>
          <CasablancaInteractiveMap />
        </div>
      </div>
    );
  }

  if (page === 'realisations') {
    return (
      <div className="bg-[#F7F4EF] min-h-screen py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MasonryGallery
            variant="light"
            extraRealizations={siteContent?.realizations || []}
            eyebrow="Galerie Masonry · Casablanca"
            title="Nos réalisations d'exception"
            subtitle="Mariages prestigieux, décorations florales sur mesure, soirées privées et événements professionnels orchestrés dans les plus belles adresses de Casablanca."
            headerActionLabel="Organiser mon événement →"
            onHeaderAction={() => navigate('event-builder')}
          />
        </div>
      </div>
    );
  }

  if (page === 'partenaires') {
    return (
      <div className="bg-[#F7F4EF] min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
              Réseau d&apos;excellence
            </span>
            <h1 className="font-display text-4xl font-semibold text-[#151515] mt-1">
              Nos partenaires à Casablanca
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(siteContent?.partners || []).map((pt) => (
              <div key={pt.name} className="bg-white border border-[#151515]/10 rounded-xl p-6 space-y-2">
                <span className="text-xs font-semibold text-[#A8843E]">{pt.sector}</span>
                <h3 className="font-display text-2xl font-semibold text-[#151515]">{pt.name}</h3>
                <p className="text-xs text-[#777777]">{pt.district}, Casablanca</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'faq') {
    return (
      <div className="bg-[#F7F4EF] min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
              Aide &amp; Informations
            </span>
            <h1 className="font-display text-4xl font-semibold text-[#151515] mt-1">
              Foire aux questions
            </h1>
          </div>

          <div className="space-y-3">
            {(siteContent?.faqs || []).map((f) => {
              const isOpen = openFaq === f.id;
              return (
                <div key={f.id} className="bg-white border border-[#151515]/10 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : f.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-[#A8843E] block">{f.category}</span>
                      <span className="font-semibold text-sm text-[#151515]">{f.question}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#777777] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-[#777777] leading-relaxed border-t border-[#151515]/5 pt-3">
                      {f.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="bg-[#F7F4EF] min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
                Conciergerie Casablanca
              </span>
              <h1 className="font-display text-4xl font-semibold text-[#151515] mt-1">
                Contactez EVENT PRO
              </h1>
              <p className="text-sm text-[#777777] mt-2 leading-relaxed">
                Nos conseillers événementiels vous accueillent sur rendez-vous au cœur du quartier Gauthier à Casablanca.
              </p>
            </div>

            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#C9A45C] shrink-0" />
                <div>
                  <strong className="block">Siège EVENT PRO (Adresse fictive)</strong>
                  <span className="text-[#777777]">18 Boulevard Moulay Youssef, Gauthier, 20250 Casablanca, Maroc</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#C9A45C] shrink-0" />
                <span className="tabular-nums">+212 522 00 11 22</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#C9A45C] shrink-0" />
                <span>concierge@eventpro.ma</span>
              </div>
              <a
                href="https://wa.me/212661000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Discuter sur WhatsApp
              </a>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="bg-white border border-[#151515]/10 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#151515]">Envoyer un message</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Nom complet *"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
              />
              <input
                type="email"
                required
                placeholder="Email *"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="tel"
                placeholder="Téléphone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
              />
              <input
                type="text"
                placeholder="Objet"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
              />
            </div>
            <textarea
              rows={5}
              required
              placeholder="Décrivez votre projet événementiel à Casablanca..."
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
            >
              {sending ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // About + Legal Pages (about, cgu, confidentialite, annulation)
  const legalContent: Record<string, { title: string; subtitle: string; sections: { heading: string; body: string }[] }> = {
    about: {
      title: 'À propos d\'EVENT PRO',
      subtitle: 'La plateforme de référence pour l\'organisation et la réservation d\'événements à Casablanca.',
      sections: [
        {
          heading: 'Notre mission',
          body: 'EVENT PRO met en relation les particuliers et les entreprises avec les professionnels les plus fiables de l\'événementiel à Casablanca : palais de réception, traiteurs gastronomiques, photographes éditoriaux, vidéastes cinéma, DJ, orchestres et décorateurs floraux.',
        },
        {
          heading: 'Exigence et transparence',
          body: 'Chaque prestataire est vérifié par notre comité d\'agrément avant sa mise en ligne. Les tarifs sont affichés en Dirhams marocains (DH) et notre calendrier empêche les doubles réservations.',
        },
      ],
    },
    cgu: {
      title: 'Conditions générales d\'utilisation',
      subtitle: 'Cadre contractuel d\'utilisation de la plateforme EVENT PRO Casablanca.',
      sections: [
        {
          heading: '1. Objet de la plateforme',
          body: 'EVENT PRO agit en qualité d\'intermédiaire de mise en relation et de gestion de réservations entre clients et prestataires événementiels basés à Casablanca et sa région.',
        },
        {
          heading: '2. Réservations et disponibilités',
          body: 'Toute demande de réservation bloque provisoirement la date dans le calendrier du prestataire jusqu\'à confirmation formelle par ce dernier sous 48 heures ouvrées.',
        },
      ],
    },
    confidentialite: {
      title: 'Politique de confidentialité',
      subtitle: 'Protection de vos données personnelles conformément à la loi 09-08 au Maroc.',
      sections: [
        {
          heading: 'Collecte et sécurité des données',
          body: 'Vos données d\'identification (nom, email, téléphone) et les détails de vos événements sont utilisés exclusivement pour traiter vos réservations et devis. Les mots de passe sont chiffrés via scrypt et ne sont jamais stockés en clair.',
        },
        {
          heading: 'Droits d\'accès et de rectification',
          body: 'Vous pouvez modifier vos informations à tout moment depuis votre espace personnel ou contacter concierge@eventpro.ma.',
        },
      ],
    },
    annulation: {
      title: 'Conditions d\'annulation',
      subtitle: 'Modalités applicables aux réservations confirmées sur EVENT PRO.',
      sections: [
        {
          heading: 'Annulation sans frais jusqu\'à J-30',
          body: 'Toute réservation en attente ou confirmée peut être annulée depuis votre Espace Client plus de 30 jours avant la date de l\'événement, libérant immédiatement le créneau dans le calendrier du prestataire.',
        },
        {
          heading: 'Annulation tardive',
          body: 'À moins de 30 jours de l\'événement, les conditions spécifiques du prestataire sélectionné s\'appliquent conformément au devis validé.',
        },
      ],
    },
  };

  const doc = legalContent[page] || legalContent.about;
  return (
    <div className="bg-[#F7F4EF] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
            EVENT PRO Casablanca
          </span>
          <h1 className="font-display text-4xl font-semibold text-[#151515] mt-1">{doc.title}</h1>
          <p className="text-sm text-[#777777] mt-1">{doc.subtitle}</p>
        </div>

        <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 sm:p-8 space-y-6">
          {doc.sections.map((s) => (
            <div key={s.heading} className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">{s.heading}</h2>
              <p className="text-sm text-[#777777] leading-relaxed">{s.body}</p>
            </div>
          ))}
          <div className="pt-4 border-t border-[#151515]/10">
            <button
              type="button"
              onClick={() => navigate('prestations')}
              className="px-5 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
            >
              Découvrir nos prestataires
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
