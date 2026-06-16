"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { EcranSelection } from "@/components/coach/EcranSelection";
import { TableauBord } from "@/components/coach/TableauBord";
import type { Programme, SelectionParams } from "@/lib/types";

type Etape = "selection" | "execution";

export default function CoachPage() {
  const [etape, setEtape] = useState<Etape>("selection");
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(false);

  // Token Spotify OAuth (optionnel) — peut être fourni via l'URL #spotify=
  const spotifyToken =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.hash.replace(/^#/, "")).get("spotify")
      : null;

  const genererSeance = async (params: SelectionParams) => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("generation");
      const data = await res.json();
      if (!data.programme || !data.programme.exercices?.length) {
        throw new Error("empty");
      }
      setProgramme(data.programme);
      setEtape("execution");
      toast.success("Séance générée !");
    } catch (e) {
      console.error(e);
      toast.error("Échec de la génération. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const retour = () => {
    setEtape("selection");
    setProgramme(null);
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="pb-12">
        {etape === "selection" || !programme ? (
          <EcranSelection onGenerer={genererSeance} loading={loading} />
        ) : (
          <TableauBord programme={programme} spotifyToken={spotifyToken} onRetour={retour} />
        )}
      </main>
    </div>
  );
}
