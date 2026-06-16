"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2 } from "lucide-react";
import { VideoExercice } from "./VideoExercice";
import { Metriques } from "./Metriques";
import { SpotifyWidget, type SpotifyController } from "./SpotifyWidget";
import { playCue, annoncerVocal, initAudio } from "@/lib/audio-cues";
import type { Programme, ExerciceProgramme } from "@/lib/types";

type Phase = "travail" | "repos" | "transition";

interface Props {
  programme: Programme;
  spotifyToken?: string | null;
  onRetour: () => void;
}

const TRANSITION_S = 5;

/**
 * Construit la séquence complète des étapes (exercices × rounds) en
 * tenant compte du nombre de rounds.
 */
function construireSequence(prog: Programme): ExerciceProgramme[] {
  const seq: ExerciceProgramme[] = [];
  const rounds = Math.max(1, prog.rounds);
  for (let r = 0; r < rounds; r++) {
    for (const ex of prog.exercices) seq.push(ex);
  }
  return seq;
}

export function TableauBord({ programme, spotifyToken, onRetour }: Props) {
  const sequence = useRef<ExerciceProgramme[]>(construireSequence(programme));
  const total = sequence.current.length;

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("travail");
  const [tempsRestant, setTempsRestant] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [auto, setAuto] = useState(true);
  const [tempsEcoule, setTempsEcoule] = useState(0);

  // Métriques simulées
  const [calories, setCalories] = useState(0);
  const [bpm, setBpm] = useState(120);

  // Spotify controller (pour ducking)
  const spotifyCtrl = useRef<SpotifyController | null>(null);
  const duckTarget = () => {
    const c = spotifyCtrl.current;
    if (!c) return undefined;
    return { current: c.getVolume(), set: (v: number) => c.setVolume(v) };
  };

  const exCourant = sequence.current[index] || null;
  const exSuivant = sequence.current[index + 1] || null;

  const dureeTravail = useCallback((ex: ExerciceProgramme | null) => {
    if (!ex) return 30;
    if (ex.duree_travail_s && ex.duree_travail_s > 0) return ex.duree_travail_s;
    // estimation si mesure non temporelle
    return 40;
  }, []);

  // Initialiser le temps quand on change de phase/exercice
  const demarrerPhase = useCallback(
    (ph: Phase, ex: ExerciceProgramme | null) => {
      setPhase(ph);
      if (ph === "travail") setTempsRestant(dureeTravail(ex));
      else if (ph === "repos") setTempsRestant(ex?.duree_repos_s ?? 30);
      else setTempsRestant(TRANSITION_S);
    },
    [dureeTravail]
  );

  // Passage à l'étape suivante
  const suivant = useCallback(() => {
    setIndex((i) => {
      const ni = i + 1;
      if (ni >= total) {
        setEnCours(false);
        return i;
      }
      annoncerVocal(`Prochain : ${sequence.current[ni].nom}`, duckTarget());
      demarrerPhase("travail", sequence.current[ni]);
      return ni;
    });
  }, [total, demarrerPhase]);

  // Boucle chrono (1s)
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => {
      setTempsEcoule((e) => e + 1);
      setCalories((c) => c + Math.round(8 + Math.random() * 4) / 10);
      setBpm(() => 130 + Math.round(Math.random() * 30));

      setTempsRestant((tr) => {
        const nt = tr - 1;
        if (nt === 3) playCue("countdown", duckTarget());
        if (nt <= 0) {
          if (!auto) return 0; // mode manuel : attend le bouton
          // Transition automatique des phases
          if (phase === "travail") {
            playCue("fin_travail", duckTarget());
            const repos = exCourant?.duree_repos_s ?? 0;
            if (repos > 0) {
              setPhase("repos");
              setTimeout(() => playCue("debut_repos", duckTarget()), 100);
              return repos;
            } else {
              setPhase("transition");
              return TRANSITION_S;
            }
          } else if (phase === "repos") {
            setPhase("transition");
            playCue("prochain", duckTarget());
            return TRANSITION_S;
          } else {
            // fin transition → exercice suivant
            suivant();
            return 0;
          }
        }
        return nt;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [enCours, auto, phase, exCourant, suivant]);

  const demarrer = () => {
    initAudio();
    if (tempsRestant === 0) demarrerPhase("travail", exCourant);
    setEnCours(true);
  };
  const pause = () => setEnCours(false);
  const reset = () => {
    setEnCours(false);
    setIndex(0);
    setTempsEcoule(0);
    setCalories(0);
    demarrerPhase("travail", sequence.current[0]);
  };

  const progression = Math.round((index / Math.max(1, total)) * 100);
  const roundCourant = Math.floor(index / Math.max(1, programme.exercices.length)) + 1;

  const fmtTemps = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const phaseLabel = phase === "travail" ? "TRAVAIL" : phase === "repos" ? "REPOS" : "TRANSITION";
  const phaseColor = phase === "travail" ? "text-chanv-or" : phase === "repos" ? "text-emerald-400" : "text-sky-400";

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
      {/* En-tête séance */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-chanv-terre">{programme.nom}</h1>
          <div className="flex gap-2 mt-1">
            <span className="badge-accent uppercase">{programme.type}</span>
            <span className="badge-neutral uppercase">{programme.format}</span>
            <span className="badge-neutral">{programme.duree_min} min</span>
          </div>
        </div>
        <button onClick={onRetour} className="btn-secondary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Nouvelle séance
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Colonne principale : vidéo + chrono */}
        <div className="lg:col-span-2 space-y-5">
          <VideoExercice
            videoId={exCourant?.video_id ?? null}
            nextVideoId={exSuivant?.video_id ?? null}
            nom={exCourant?.nom ?? "—"}
          />

          {/* Chrono */}
          <div className="card p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-center">
                <div className={`text-sm uppercase tracking-[3px] font-bold ${phaseColor}`}>{phaseLabel}</div>
                <div className="text-7xl md:text-8xl font-extrabold text-chanv-terre tabular-nums leading-none">
                  {fmtTemps(tempsRestant)}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-chanv-terre/60">Round {roundCourant}/{programme.rounds}</div>
                <div className="text-sm text-chanv-terre/60">Total écoulé : {fmtTemps(tempsEcoule)}</div>
                <div className="text-sm text-chanv-terre/60">Étape {Math.min(index + 1, total)}/{total}</div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mt-5 h-3 bg-chanv-terre/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-chanv-or transition-all duration-500"
                style={{ width: `${progression}%` }}
              />
            </div>

            {/* Contrôles */}
            <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
              {!enCours ? (
                <button onClick={demarrer} className="btn-primary flex items-center gap-2 px-8 py-4 text-lg">
                  <Play className="w-5 h-5" /> Démarrer
                </button>
              ) : (
                <button onClick={pause} className="btn-secondary flex items-center gap-2 px-8 py-4 text-lg">
                  <Pause className="w-5 h-5" /> Pause
                </button>
              )}
              <button onClick={suivant} className="btn-secondary flex items-center gap-2 px-6 py-4">
                <SkipForward className="w-5 h-5" /> Suivant
              </button>
              <button onClick={reset} className="btn-secondary p-4 rounded-full" title="Réinitialiser">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setAuto((a) => !a)}
                className={`px-5 py-4 rounded-chanv font-semibold ${auto ? "badge-accent" : "badge-neutral"}`}
                title="Mode auto/manuel"
              >
                {auto ? "Mode AUTO" : "Mode MANUEL"}
              </button>
            </div>
          </div>

          <Metriques
            calories={Math.round(calories)}
            frequenceCardiaque={bpm}
            rounds={`${roundCourant}/${programme.rounds}`}
            rpe={Math.min(10, 5 + (tempsEcoule / 60) * 0.3)}
          />
        </div>

        {/* Colonne latérale : prochain + spotify + liste */}
        <div className="space-y-5">
          <SpotifyWidget token={spotifyToken} onController={(c) => (spotifyCtrl.current = c)} />

          {/* Prochain exercice */}
          <div className="section-card">
            <div className="label flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" /> Prochain exercice
            </div>
            {exSuivant ? (
              <div className="font-bold text-xl text-chanv-terre">{exSuivant.nom}</div>
            ) : (
              <div className="text-chanv-terre/50">Dernier exercice 🎉</div>
            )}
          </div>

          {/* Détails exercice courant */}
          {exCourant && (
            <div className="card p-5 space-y-2">
              <div className="text-xs uppercase tracking-wider text-chanv-terre/55">Consignes</div>
              <p className="text-sm text-chanv-terre/80">{exCourant.consignes || "—"}</p>
              <div className="flex gap-2 pt-2 flex-wrap">
                <span className="badge-neutral">{exCourant.valeur} {exCourant.unite}</span>
                {exCourant.charge_h != null && (
                  <span className="badge-neutral">H : {exCourant.charge_h} lbs</span>
                )}
                {exCourant.charge_f != null && (
                  <span className="badge-neutral">F : {exCourant.charge_f} lbs</span>
                )}
              </div>
            </div>
          )}

          {/* Liste des exercices */}
          <div className="card p-4">
            <div className="label mb-3">Programme ({programme.exercices.length} exercices)</div>
            <ol className="space-y-2 max-h-80 overflow-y-auto">
              {programme.exercices.map((ex, i) => (
                <li
                  key={`${ex.video_id}-${i}`}
                  className="flex items-center gap-3 p-2 rounded-chanv bg-chanv-terre/5"
                >
                  <span className="w-7 h-7 rounded-full bg-chanv-or/20 text-chanv-or font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {ex.ordre}
                  </span>
                  <span className="flex-1 font-medium text-chanv-terre text-sm">{ex.nom}</span>
                  <span className="text-xs text-chanv-terre/50">{ex.valeur} {ex.unite}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
