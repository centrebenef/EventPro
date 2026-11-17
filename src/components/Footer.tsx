import React, { useState } from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BrandLogo } from './Logo.tsx';
import { useApp } from '../context/AppContext.tsx';

export function Footer() {
  const { navigate, showToast, openAuthModal } = useApp();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Inscription confirmée !', 'success');
        setEmail('');
      } else {
        showToast(data.error || 'Erreur lors de l\'inscription.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#151515] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <BrandLogo dark />
            <p className="text-sm text-white/70 leading-relaxed">
              Chaque événement mérite d&apos;être exceptionnel. La plateforme de référence pour
              sélectionner, comparer et réserver les meilleurs professionnels de l&apos;événementiel à
              Casablanca.
            </p>
            <div className="space-y-2 text-xs text-white/70 pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                <span>18 Bd Moulay Youssef, Gauthier, Casablanca (Adresse fictive)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C9A45C] shrink-0" />
                <span className="tabular-nums">+212 522 00 11 22</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C9A45C] shrink-0" />
                <span>concierge@eventpro.ma</span>
              </div>
            </div>
          </div>

          {/* Prestations */}
          <div>
            <h4 className="font-display text-lg font-semibold text-[#C9A45C] mb-4">
              Nos Prestations
            </h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <button type="button" onClick={() => navigate('salles')} className="hover:text-[#C9A45C] transition-colors">
                  Salles de réception
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('photographes')} className="hover:text-[#C9A45C] transition-colors">
                  Photographes &amp; Vidéastes
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('traiteurs')} className="hover:text-[#C9A45C] transition-colors">
                  Traiteurs gastronomiques
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('dj')} className="hover:text-[#C9A45C] transition-colors">
                  DJ &amp; Animation
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('decoration')} className="hover:text-[#C9A45C] transition-colors">
                  Décoration florale &amp; Design
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('organisation')} className="hover:text-[#C9A45C] transition-colors">
                  Organisation complète
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('event-builder')} className="hover:text-[#C9A45C] transition-colors">
                  Event Builder interactif
                </button>
              </li>
            </ul>
          </div>

          {/* Découvrir & Légal */}
          <div>
            <h4 className="font-display text-lg font-semibold text-[#C9A45C] mb-4">
              Informations
            </h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <button type="button" onClick={() => navigate('about')} className="hover:text-[#C9A45C] transition-colors">
                  À propos d&apos;EVENT PRO
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('realisations')} className="hover:text-[#C9A45C] transition-colors">
                  Nos réalisations
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('partenaires')} className="hover:text-[#C9A45C] transition-colors">
                  Nos partenaires
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('faq')} className="hover:text-[#C9A45C] transition-colors">
                  Foire aux questions (FAQ)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('contact')} className="hover:text-[#C9A45C] transition-colors">
                  Contact
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openAuthModal('provider-register')} className="hover:text-[#C9A45C] transition-colors">
                  Devenir prestataire
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter & WhatsApp */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-[#C9A45C]">
              Newsletter &amp; Conciergerie
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              Recevez nos inspirations mariages, nouvelles salles à Casablanca et offres privilèges.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.ma"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A45C]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#C9A45C] text-[#151515] font-semibold text-xs rounded-lg hover:bg-white transition-colors"
              >
                {submitting ? 'Enregistrement...' : 'S\'inscrire à la newsletter'}
              </button>
            </form>
            <a
              href="https://wa.me/212661000000?text=Bonjour%20EVENT%20PRO%20Casablanca%2C%20je%20souhaite%20organiser%20un%20%C3%A9v%C3%A9nement."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 border border-white/20 rounded-lg text-xs font-semibold text-white hover:border-[#C9A45C] hover:text-[#C9A45C] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#C9A45C]" />
              Contacter sur WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© 2026 EVENT PRO Casablanca, Maroc. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-5">
            <button type="button" onClick={() => navigate('cgu')} className="hover:text-white transition-colors">
              Conditions générales
            </button>
            <button type="button" onClick={() => navigate('confidentialite')} className="hover:text-white transition-colors">
              Politique de confidentialité
            </button>
            <button type="button" onClick={() => navigate('annulation')} className="hover:text-white transition-colors">
              Conditions d&apos;annulation
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
