"use client";

import { Flame, HeartPulse, Repeat, Gauge } from "lucide-react";

interface Props {
  calories: number;
  frequenceCardiaque: number;
  rounds: string;
  rpe: number;
}

/**
 * Tuiles de métriques (bas de l'écran). Valeurs simulées pour le MVP.
 * Interface propre prête à brancher une vraie source cardio plus tard.
 */
export function Metriques({ calories, frequenceCardiaque, rounds, rpe }: Props) {
  const tuiles = [
    { icon: Flame, label: "Calories", valeur: `${calories}`, unite: "kcal" },
    { icon: HeartPulse, label: "Fréq. card.", valeur: `${frequenceCardiaque}`, unite: "bpm" },
    { icon: Repeat, label: "Rounds", valeur: rounds, unite: "" },
    { icon: Gauge, label: "RPE moyen", valeur: `${rpe.toFixed(1)}`, unite: "/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tuiles.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.label} className="section-card flex items-center gap-3">
            <div className="bg-chanv-or/15 p-2.5 rounded-chanv">
              <Icon className="w-6 h-6 text-chanv-or" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-chanv-terre/60">{t.label}</div>
              <div className="text-2xl font-extrabold text-chanv-terre leading-none">
                {t.valeur}
                <span className="text-sm font-normal text-chanv-terre/50 ml-1">{t.unite}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
