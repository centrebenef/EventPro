import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CasablancaInteractiveMap } from './CasablancaMap.tsx';
import { TextRevealTitle } from './TextRevealTitle.tsx';

export function DiscoverCasablancaSection() {
  const { navigate } = useApp();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Discover Casablanca — Carte interactive des prestataires par quartier"
      className="bg-[#151515] text-white py-20 border-y border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Editorial Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
        >
          <div className="max-w-2xl space-y-2.5">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A45C] block">
              Discover Casablanca
            </span>
            <TextRevealTitle
              as="h2"
              surface="dark"
              text="Nos adresses et prestataires d’exception par quartier"
              className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight"
            />
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Explorez la métropole blanche de la Corniche aux domaines boisés : sélectionnez un
              marqueur à Maarif, Anfa, Ain Diab, Bouskoura ou Californie pour consulter la fiche et
              les coordonnées directes de chaque prestataire.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('carte')}
            className="px-5 py-2.5 border border-[#C9A45C]/45 text-[#C9A45C] text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center gap-2 self-start lg:self-auto whitespace-nowrap shrink-0"
          >
            Ouvrir la carte plein écran
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Interactive Casablanca District & Provider Map */}
        <CasablancaInteractiveMap surface="dark" />
      </div>
    </section>
  );
}
