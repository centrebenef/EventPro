import React, { useEffect, useRef, useState } from 'react';
import { Award, Briefcase, CalendarCheck, Users } from 'lucide-react';
import { TextRevealTitle } from './TextRevealTitle.tsx';

interface StatItem {
  id: string;
  target: number;
  suffix: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATS: StatItem[] = [
  {
    id: 'events',
    target: 480,
    suffix: '+',
    label: 'Événements organisés',
    sublabel: 'Mariages, galas et conférences à Casablanca',
    icon: Award,
  },
  {
    id: 'clients',
    target: 1240,
    suffix: '+',
    label: 'Clients satisfaits',
    sublabel: 'Particuliers et entreprises accompagnés',
    icon: Users,
  },
  {
    id: 'providers',
    target: 85,
    suffix: '+',
    label: 'Prestataires partenaires',
    sublabel: 'Professionnels audités et certifiés',
    icon: Briefcase,
  },
  {
    id: 'bookings',
    target: 640,
    suffix: '+',
    label: 'Réservations',
    sublabel: 'Confirmées sans conflit de calendrier',
    icon: CalendarCheck,
  },
];

export function PremiumStatsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<number[]>(() => STATS.map(() => 0));

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || hasAnimated) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startAnimation = () => {
      setHasAnimated(true);
      if (prefersReducedMotion) {
        setCounts(STATS.map((s) => s.target));
        return;
      }

      const duration = 1600;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        setCounts(STATS.map((s) => Math.round(s.target * eased)));

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          setCounts(STATS.map((s) => s.target));
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      aria-label="Chiffres clés EVENT PRO"
      className="bg-[#151515] text-white border-y border-white/10 py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/15 pb-8">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A45C]">
              Impact &amp; Excellence
            </span>
            <TextRevealTitle
              as="h2"
              surface="dark"
              text="La confiance de Casablanca en chiffres"
              className="font-display text-3xl sm:text-4xl font-semibold text-white"
            />
          </div>
          <p className="text-sm text-white/70 max-w-md">
            Des réceptions orchestrées avec rigueur auprès des adresses et prestataires les plus
            recherchés de la métropole.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="bg-white/[0.03] border border-white/15 rounded-xl p-6 flex flex-col justify-between space-y-5 transition-colors hover:border-[#C9A45C]/60"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-lg bg-black border border-white/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#C9A45C]" />
                  </div>
                  <span className="font-mono text-xs text-white/40 tabular-nums">
                    0{idx + 1}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="font-mono text-4xl sm:text-5xl font-bold text-white tracking-tight tabular-nums">
                    {counts[idx].toLocaleString('fr-FR')}
                    <span className="text-[#C9A45C]">{stat.suffix}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    {stat.label}
                  </h3>
                  <p className="text-xs text-white/65 leading-relaxed">
                    {stat.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
