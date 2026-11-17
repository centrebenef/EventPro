import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { BrandLogo } from './Logo.tsx';

const WELCOME_STORAGE_KEY = 'eventpro_welcome_popup_seen_v1';
const WELCOME_HERO_IMG = '/src/assets/images/hero_wedding_casablanca_1794908654336.jpg';

export function WelcomePopup() {
  const { initialLoading, navigate } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Trigger automatically once right after initial load completes on first visit
  useEffect(() => {
    if (initialLoading) return;

    let alreadySeen = false;
    try {
      alreadySeen = window.localStorage.getItem(WELCOME_STORAGE_KEY) === '1';
    } catch {
      alreadySeen = false;
    }

    if (alreadySeen) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [initialLoading]);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, '1');
    } catch {
      // ignore storage restrictions
    }
  };

  // Close cleanly with Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleAction = (page: 'prestations' | 'event-builder') => {
    dismiss();
    navigate(page);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-popup-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-popup-title"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={dismiss}
          className="fixed inset-0 z-[60] bg-[#151515]/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }
            }
            animate={
              shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#F7F4EF] text-[#151515] rounded-2xl border border-[#C9A45C]/45 shadow-2xl grid grid-cols-1 md:grid-cols-12"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer la fenêtre de bienvenue"
              className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-[#151515] text-[#151515] hover:text-white border border-[#151515]/15 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Visual Luxury Showcase Panel */}
            <div className="md:col-span-5 relative bg-[#151515] text-white min-h-[200px] md:min-h-[420px] flex flex-col justify-between p-6 overflow-hidden">
              {!imgFailed && (
                <img
                  src={WELCOME_HERO_IMG}
                  alt="Réception prestigieuse orchestrée par EVENT PRO à Casablanca"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              )}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/50 to-[#151515]/60"
              />

              <div className="relative z-10">
                <BrandLogo dark />
              </div>

              <div className="relative z-10 space-y-2 pt-10 md:pt-0">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A45C]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Casablanca
                </span>
                <p className="font-display text-2xl font-semibold leading-snug text-white">
                  L&apos;art de recevoir au plus haut niveau d&apos;exigence.
                </p>
              </div>
            </div>

            {/* Right Editorial Welcome Message */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-4 pr-6">
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#A8843E] block">
                  Bienvenue sur EVENT PRO
                </span>
                <h2
                  id="welcome-popup-title"
                  className="font-display text-3xl sm:text-4xl font-semibold text-[#151515] leading-[1.12]"
                >
                  Chaque événement mérite d&apos;être exceptionnel
                </h2>
                <p className="text-sm text-[#151515]/80 leading-relaxed">
                  Organisez facilement votre mariage, gala ou réception privée à Casablanca :
                  découvrez nos lieux et prestataires vérifiés à Anfa, Ain Diab, Maarif,
                  Californie et Bouskoura.
                </p>

                <ul className="space-y-2.5 pt-2">
                  {[
                    'Prestataires sélectionnés avec tarifs transparents en DH',
                    'Configurateur budgétaire sur mesure et devis PDF immédiats',
                    'Conseils personnalisés via votre assistant EVENT AI',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#151515]/85"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#A8843E] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#151515]/10">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleAction('event-builder')}
                    className="flex-1 py-3 px-4 bg-[#151515] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    Créer mon événement
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('prestations')}
                    className="flex-1 py-3 px-4 bg-white border border-[#151515]/20 text-[#151515] text-xs sm:text-sm font-semibold rounded-lg hover:border-[#151515] transition-colors whitespace-nowrap shrink-0"
                  >
                    Voir les prestataires
                  </button>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="w-full py-1.5 text-xs font-medium text-[#777777] hover:text-[#151515] transition-colors"
                >
                  Explorer la page d&apos;accueil
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
