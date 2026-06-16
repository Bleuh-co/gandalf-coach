import type { ExerciceCatalogue, WorkoutType, WorkoutFormat, Niveau } from "./types";

/**
 * Catalogue d'exercices disponibles. Chaque exercice possède un video_id
 * stable correspondant à un clip Veo pré-généré (boucle vidéo).
 *
 * ⚠️ Le LLM ne peut choisir QUE des exercices présents dans ce catalogue.
 *    Interdiction d'inventer un exercice sans video_id.
 */
export const CATALOGUE: ExerciceCatalogue[] = [
  { video_id: "skierg_loop", nom: "SkiErg", equipement: "skierg" },
  { video_id: "sled_push_loop", nom: "Sled Push", equipement: "sled" },
  { video_id: "sled_pull_loop", nom: "Sled Pull", equipement: "sled" },
  { video_id: "burpee_bj_loop", nom: "Burpee Broad Jump", equipement: "aucun" },
  { video_id: "rameur_loop", nom: "Rameur", equipement: "rameur" },
  { video_id: "lunges_sac_loop", nom: "Lunges avec sac", equipement: "sandbag" },
  { video_id: "wall_ball_loop", nom: "Wall Ball", equipement: "medecine_ball" },
  { video_id: "kettlebell_swing_loop", nom: "Kettlebell Swing", equipement: "kettlebell" },
  { video_id: "box_jump_loop", nom: "Box Jump", equipement: "box" },
  { video_id: "thruster_loop", nom: "Thruster", equipement: "barre" },
  { video_id: "pullup_loop", nom: "Pull-up", equipement: "barre_fixe" },
  { video_id: "double_under_loop", nom: "Double Under", equipement: "corde" },
];

export const CATALOGUE_VIDEO_IDS = new Set(CATALOGUE.map((e) => e.video_id));

/**
 * Résout l'URL d'une vidéo à partir d'un video_id. Pour le MVP, on pointe
 * vers un dossier d'assets local. Remplacer par le CDN Veo en production.
 */
export function videoUrl(videoId: string): string {
  return `/videos/${videoId}.mp4`;
}

export const TYPES_ENTRAINEMENT: { value: WorkoutType; label: string; emoji: string; desc: string }[] = [
  { value: "hyrox", label: "Hyrox", emoji: "🏃", desc: "Course + stations fonctionnelles" },
  { value: "crossfit", label: "CrossFit", emoji: "🏋️", desc: "Mouvements variés haute intensité" },
  { value: "hiit", label: "HIIT métabolique", emoji: "🔥", desc: "Intervalles intenses" },
  { value: "endurance", label: "Endurance", emoji: "⏱️", desc: "Effort prolongé continu" },
  { value: "force", label: "Force", emoji: "💪", desc: "Charges lourdes, faibles reps" },
];

export const DUREES: number[] = [20, 30, 45, 60];

export const FORMATS: { value: WorkoutFormat; label: string }[] = [
  { value: "for_time", label: "For Time" },
  { value: "amrap", label: "AMRAP" },
  { value: "emom", label: "EMOM" },
  { value: "circuit", label: "Circuit" },
  { value: "tabata", label: "Tabata" },
];

export const NIVEAUX: { value: Niveau; label: string }[] = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance", label: "Avancé" },
];
