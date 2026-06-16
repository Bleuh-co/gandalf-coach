"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, Music } from "lucide-react";

export interface SpotifyController {
  setVolume: (v: number) => void;
  getVolume: () => number;
}

interface TrackInfo {
  name: string;
  artist: string;
  cover: string;
  paused: boolean;
}

/**
 * Widget Spotify (Web Playback SDK). Nécessite un compte Premium + OAuth.
 *
 * Pour le MVP, ce composant gère :
 *  - le chargement du SDK
 *  - l'affichage pochette/titre/artiste + contrôles play/pause/skip
 *  - l'exposition d'un contrôleur de volume (pour le ducking des cues)
 *
 * Le token OAuth doit être fourni via la prop `token`. Sans token, le
 * widget affiche un état "non connecté" mais l'app reste pleinement
 * fonctionnelle (le coach peut animer sans musique Spotify).
 */
export function SpotifyWidget({
  token,
  onController,
}: {
  token?: string | null;
  onController?: (c: SpotifyController) => void;
}) {
  const playerRef = useRef<any>(null);
  const volumeRef = useRef<number>(0.5);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Charger le SDK
    const scriptId = "spotify-sdk";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://sdk.scdn.co/spotify-player.js";
      s.async = true;
      document.body.appendChild(s);
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: "Gandalf Coach — Gym",
        getOAuthToken: (cb: (t: string) => void) => cb(token),
        volume: volumeRef.current,
      });

      player.addListener("ready", () => {
        setPret(true);
        const ctrl: SpotifyController = {
          setVolume: (v: number) => {
            volumeRef.current = v;
            player.setVolume(v).catch(() => {});
          },
          getVolume: () => volumeRef.current,
        };
        onController?.(ctrl);
      });

      player.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        const cur = state.track_window?.current_track;
        if (cur) {
          setTrack({
            name: cur.name,
            artist: cur.artists?.map((a: any) => a.name).join(", ") || "",
            cover: cur.album?.images?.[0]?.url || "",
            paused: state.paused,
          });
        }
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      try { playerRef.current?.disconnect(); } catch {}
    };
  }, [token]);

  const togglePlay = () => playerRef.current?.togglePlay().catch(() => {});
  const skip = () => playerRef.current?.nextTrack().catch(() => {});

  if (!token) {
    return (
      <div className="section-card flex items-center gap-3 text-chanv-terre/70">
        <Music className="w-5 h-5" />
        <div className="text-sm">
          <div className="font-semibold">Spotify non connecté</div>
          <div className="text-xs">Compte Premium + OAuth requis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card flex items-center gap-4">
      {track?.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.cover} alt="" className="w-14 h-14 rounded-chanv object-cover" />
      ) : (
        <div className="w-14 h-14 rounded-chanv bg-chanv-terre/10 flex items-center justify-center">
          <Music className="w-6 h-6 text-chanv-terre/50" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{track?.name || (pret ? "Prêt" : "Connexion...")}</div>
        <div className="text-sm text-chanv-terre/60 truncate">{track?.artist || "—"}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={togglePlay} className="btn-secondary p-3 rounded-full" title="Play/Pause">
          {track?.paused === false ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={skip} className="btn-secondary p-3 rounded-full" title="Suivant">
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
