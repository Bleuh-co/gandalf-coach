"use client";

import { useEffect, useRef, useState } from "react";
import { videoUrl } from "@/lib/catalogue";

interface Props {
  videoId: string | null;
  nextVideoId?: string | null;
  nom: string;
}

/**
 * Lecteur vidéo central en boucle. Précharge la vidéo suivante.
 * Fallback : placeholder si la vidéo est absente ou échoue.
 */
export function VideoExercice({ videoId, nextVideoId, nom }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    setErreur(false);
    const v = videoRef.current;
    if (v && videoId) {
      v.load();
      v.play().catch(() => {/* autoplay bloqué — ignore */});
    }
  }, [videoId]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-chanv overflow-hidden border-2 border-chanv-or/30">
      {videoId && !erreur ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          autoPlay
          onError={() => setErreur(true)}
        >
          <source src={videoUrl(videoId)} type="video/mp4" />
        </video>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-center gap-4 bg-gradient-to-br from-chanv-terre to-black">
          <div className="text-7xl">🏋️</div>
          <div className="text-3xl md:text-5xl font-bold text-chanv-fibre px-6">{nom}</div>
          <div className="text-sm uppercase tracking-[3px] text-chanv-or">Démonstration vidéo bientôt disponible</div>
        </div>
      )}

      {/* Bandeau nom exercice courant */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
        <div className="text-4xl md:text-6xl font-extrabold text-chanv-fibre drop-shadow-lg">{nom}</div>
      </div>

      {/* Préchargement de la vidéo suivante (invisible) */}
      {nextVideoId && (
        <video className="hidden" preload="auto" muted playsInline>
          <source src={videoUrl(nextVideoId)} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
