/**
 * Gestion des cues sonores via Web Audio API, sur un canal séparé de
 * Spotify. Inclut le "ducking" (baisse temporaire du volume Spotify)
 * et l'annonce vocale TTS optionnelle (Web Speech API).
 *
 * ⚠️ On n'insère JAMAIS de son dans le flux Spotify (techniquement
 *    impossible). On joue sur notre propre AudioContext et on baisse
 *    le volume Spotify via le SDK pendant ~1,5 s.
 */

let ctx: AudioContext | null = null;

function audioContext(): AudioContext {
  if (typeof window === "undefined") throw new Error("no window");
  if (!ctx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Joue un bip simple (beep) avec une enveloppe douce. */
function beep(freq: number, dureeMs: number, gainMax = 0.3) {
  const ac = audioContext();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);
  const now = ac.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(gainMax, now + 0.02);
  gain.gain.linearRampToValueAtTime(0, now + dureeMs / 1000);
  osc.start(now);
  osc.stop(now + dureeMs / 1000 + 0.05);
}

export type CueType = "fin_travail" | "debut_repos" | "prochain" | "countdown";

/** Type de fonction permettant de piloter le volume Spotify (ducking). */
export type SpotifyVolumeSetter = (volume: number) => void;

/**
 * Joue un cue sonore + applique le ducking Spotify.
 * Baisse le volume à ~20% pendant ~1,5 s puis le remonte en fondu.
 */
export function playCue(
  type: CueType,
  spotifyVolume?: { current: number; set: SpotifyVolumeSetter }
) {
  // Sons selon le type
  switch (type) {
    case "fin_travail":
      beep(880, 200);
      setTimeout(() => beep(660, 250), 220);
      break;
    case "debut_repos":
      beep(440, 400);
      break;
    case "prochain":
      beep(990, 150);
      setTimeout(() => beep(990, 150), 200);
      break;
    case "countdown":
      beep(750, 120);
      break;
  }

  // Ducking Spotify
  if (spotifyVolume) {
    duckSpotify(spotifyVolume.current, spotifyVolume.set);
  }
}

/** Baisse le volume Spotify à 20% puis le remonte en fondu sur ~1,5 s. */
export function duckSpotify(volumeActuel: number, set: SpotifyVolumeSetter) {
  const bas = Math.max(0, volumeActuel * 0.2);
  set(bas);
  const dureeRemonteeMs = 1500;
  const steps = 15;
  let i = 0;
  const interval = setInterval(() => {
    i++;
    const t = i / steps;
    const v = bas + (volumeActuel - bas) * t;
    set(v);
    if (i >= steps) clearInterval(interval);
  }, dureeRemonteeMs / steps);
}

/**
 * Annonce vocale TTS du prochain exercice (Web Speech API).
 * Applique aussi le ducking Spotify.
 */
export function annoncerVocal(
  texte: string,
  spotifyVolume?: { current: number; set: SpotifyVolumeSetter }
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = "fr-FR";
  u.rate = 1;
  if (spotifyVolume) duckSpotify(spotifyVolume.current, spotifyVolume.set);
  window.speechSynthesis.speak(u);
}

/** Initialise l'AudioContext suite à une interaction utilisateur. */
export function initAudio() {
  try {
    audioContext();
  } catch {/* ignore */}
}
