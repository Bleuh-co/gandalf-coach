"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { TYPES_ENTRAINEMENT, DUREES, FORMATS, NIVEAUX } from "@/lib/catalogue";
import type { SelectionParams, WorkoutType, WorkoutFormat, Niveau } from "@/lib/types";

interface Props {
  onGenerer: (params: SelectionParams) => void;
  loading: boolean;
}

/**
 * Écran de sélection (étape 1) : grandes tuiles tactiles, sélecteur de
 * durée, options secondaires repliables, bouton « Générer la séance ».
 */
export function EcranSelection({ onGenerer, loading }: Props) {
  const [type, setType] = useState<WorkoutType>("hiit");
  const [duree, setDuree] = useState<number>(30);
  const [niveau, setNiveau] = useState<Niveau>("intermediaire");
  const [format, setFormat] = useState<WorkoutFormat>("circuit");
  const [participants, setParticipants] = useState<number>(8);
  const [competition, setCompetition] = useState<string>("");
  const [optionsOuvertes, setOptionsOuvertes] = useState(false);

  const generer = () => {
    onGenerer({
      type,
      competition: competition.trim() || null,
      duree_min: duree,
      niveau,
      format,
      participants,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-chanv-terre">Configurer la séance</h1>
        <p className="text-chanv-terre/60 text-lg">Choisissez le type d&apos;entraînement et la durée</p>
      </div>

      {/* Tuiles type */}
      <div>
        <div className="label mb-3">Type / compétition</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TYPES_ENTRAINEMENT.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`card p-5 text-center transition-all min-h-[130px] flex flex-col items-center justify-center gap-2 ${
                type === t.value ? "ring-4 ring-chanv-or scale-[1.03]" : "hover:scale-[1.02]"
              }`}
            >
              <div className="text-4xl">{t.emoji}</div>
              <div className="font-bold text-lg text-chanv-terre">{t.label}</div>
              <div className="text-xs text-chanv-terre/55 leading-tight">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Durée */}
      <div>
        <div className="label mb-3">Durée de la séance</div>
        <div className="grid grid-cols-4 gap-3">
          {DUREES.map((d) => (
            <button
              key={d}
              onClick={() => setDuree(d)}
              className={`card py-6 text-center transition-all ${
                duree === d ? "ring-4 ring-chanv-or scale-[1.03]" : "hover:scale-[1.02]"
              }`}
            >
              <div className="text-3xl font-extrabold text-chanv-terre">{d}</div>
              <div className="text-xs uppercase tracking-wider text-chanv-terre/55">minutes</div>
            </button>
          ))}
        </div>
      </div>

      {/* Options secondaires repliables */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setOptionsOuvertes((o) => !o)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <span className="font-bold text-chanv-terre">Options avancées</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${optionsOuvertes ? "rotate-180" : ""}`} />
        </button>
        {optionsOuvertes && (
          <div className="p-5 pt-0 grid md:grid-cols-2 gap-5">
            <div>
              <div className="label mb-2">Niveau</div>
              <div className="flex gap-2 flex-wrap">
                {NIVEAUX.map((n) => (
                  <button
                    key={n.value}
                    onClick={() => setNiveau(n.value)}
                    className={niveau === n.value ? "badge-accent" : "badge-neutral"}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-2">Format</div>
              <div className="flex gap-2 flex-wrap">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={format === f.value ? "badge-accent" : "badge-neutral"}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label mb-2 block">Nombre de participants</label>
              <input
                type="number"
                min={1}
                max={50}
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label mb-2 block">Compétition ciblée (optionnel)</label>
              <input
                type="text"
                placeholder="Ex : Hyrox Montréal 2025"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bouton générer */}
      <div className="flex justify-center pt-2">
        <button
          onClick={generer}
          disabled={loading}
          className="btn-primary text-xl px-12 py-5 flex items-center gap-3"
        >
          <Sparkles className="w-6 h-6" />
          {loading ? "Génération IA en cours..." : "Générer la séance"}
        </button>
      </div>
    </div>
  );
}
