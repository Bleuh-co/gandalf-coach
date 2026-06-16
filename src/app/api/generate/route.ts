import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { CATALOGUE, CATALOGUE_VIDEO_IDS } from "@/lib/catalogue";
import type { Programme, SelectionParams, ExerciceProgramme } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Parse défensif de la sortie LLM : retire d'éventuelles balises ```json
 * et extrait le premier objet JSON.
 */
function parseDefensif(raw: string): any {
  let txt = raw.trim();
  // Retirer les fences markdown
  txt = txt.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // Extraire le premier objet { ... }
  const start = txt.indexOf("{");
  const end = txt.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    txt = txt.slice(start, end + 1);
  }
  return JSON.parse(txt);
}

/**
 * Valide et nettoie le programme : ne garde que les exercices dont le
 * video_id existe dans le catalogue.
 */
function validerProgramme(prog: any, params: SelectionParams): Programme {
  const exercices: ExerciceProgramme[] = (prog.exercices || [])
    .filter((e: any) => e && CATALOGUE_VIDEO_IDS.has(e.video_id))
    .map((e: any, i: number) => ({
      ordre: typeof e.ordre === "number" ? e.ordre : i + 1,
      nom: String(e.nom || ""),
      video_id: String(e.video_id),
      type_mesure: e.type_mesure || "reps",
      valeur: typeof e.valeur === "number" ? e.valeur : 0,
      unite: e.unite || "reps",
      charge_h: typeof e.charge_h === "number" ? e.charge_h : null,
      charge_f: typeof e.charge_f === "number" ? e.charge_f : null,
      duree_travail_s: typeof e.duree_travail_s === "number" ? e.duree_travail_s : null,
      duree_repos_s: typeof e.duree_repos_s === "number" ? e.duree_repos_s : null,
      consignes: String(e.consignes || ""),
    }))
    .sort((a: ExerciceProgramme, b: ExerciceProgramme) => a.ordre - b.ordre);

  return {
    id: prog.id || `wk_${Date.now()}`,
    nom: prog.nom || `Séance ${params.type}`,
    type: params.type,
    competition: prog.competition ?? params.competition ?? null,
    duree_min: params.duree_min,
    format: prog.format || params.format,
    niveau: prog.niveau || params.niveau,
    rounds: typeof prog.rounds === "number" ? prog.rounds : 1,
    exercices,
  };
}

/**
 * Fallback déterministe quand aucune clé LLM n'est configurée ou en cas
 * d'erreur. Génère un circuit cohérent à partir du catalogue.
 */
function fallbackProgramme(params: SelectionParams): Programme {
  const pool = CATALOGUE.slice();
  const nbEx = Math.max(4, Math.min(8, Math.round(params.duree_min / 6)));
  const choisis = pool.slice(0, nbEx);
  const travailParEx = 45;
  const reposParEx = 15;
  const tempsParRound = choisis.length * (travailParEx + reposParEx);
  const rounds = Math.max(2, Math.round((params.duree_min * 60) / tempsParRound));

  const exercices: ExerciceProgramme[] = choisis.map((e, i) => ({
    ordre: i + 1,
    nom: e.nom,
    video_id: e.video_id,
    type_mesure: "temps",
    valeur: travailParEx,
    unite: "s",
    charge_h: e.equipement === "kettlebell" ? 24 : e.equipement === "barre" ? 95 : null,
    charge_f: e.equipement === "kettlebell" ? 16 : e.equipement === "barre" ? 65 : null,
    duree_travail_s: travailParEx,
    duree_repos_s: reposParEx,
    consignes: `${e.nom} — maintenir une bonne technique pendant ${travailParEx}s.`,
  }));

  return {
    id: `wk_${Date.now()}`,
    nom: `${params.type.toUpperCase()} — ${params.duree_min} min`,
    type: params.type,
    competition: params.competition ?? null,
    duree_min: params.duree_min,
    format: params.format,
    niveau: params.niveau,
    rounds,
    exercices,
  };
}

async function genererAvecLLM(params: SelectionParams): Promise<Programme> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackProgramme(params);

  const catalogueJson = JSON.stringify(
    CATALOGUE.map((e) => ({ video_id: e.video_id, nom: e.nom, equipement: e.equipement })),
    null,
    0
  );

  const systemPrompt = `Tu es un coach sportif expert (Hyrox, CrossFit, HIIT). Tu génères un programme d'entraînement de groupe.

CONTRAINTES ABSOLUES :
1. Tu choisis UNIQUEMENT des exercices présents dans le catalogue fourni. Chaque exercice DOIT avoir un video_id valide du catalogue. Interdiction d'inventer un exercice.
2. Budget temps : la somme (durée_travail + durée_repos + ~5s transition) × rounds ≈ durée demandée (tolérance ±10%).
3. Réponds UNIQUEMENT avec un objet JSON conforme au schéma, sans texte, sans Markdown, sans balises.

SCHÉMA :
{
  "id": "string",
  "nom": "string",
  "type": "hyrox|crossfit|hiit|endurance|force",
  "competition": "string|null",
  "duree_min": number,
  "format": "for_time|amrap|emom|circuit|tabata",
  "niveau": "debutant|intermediaire|avance",
  "rounds": number,
  "exercices": [
    {
      "ordre": number,
      "nom": "string",
      "video_id": "string (du catalogue)",
      "type_mesure": "distance|reps|temps|calories",
      "valeur": number,
      "unite": "m|reps|s|cal|lbs",
      "charge_h": number|null,
      "charge_f": number|null,
      "duree_travail_s": number|null,
      "duree_repos_s": number|null,
      "consignes": "string"
    }
  ]
}`;

  const userPrompt = `Génère une séance :
- Type/compétition : ${params.type}${params.competition ? ` (${params.competition})` : ""}
- Durée : ${params.duree_min} minutes
- Format : ${params.format}
- Niveau : ${params.niveau}
${params.participants ? `- Participants : ${params.participants}` : ""}

CATALOGUE D'EXERCICES DISPONIBLES (utilise UNIQUEMENT ces video_id) :
${catalogueJson}

Réponds avec le JSON uniquement.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      console.warn("[generate] LLM HTTP error", res.status);
      return fallbackProgramme(params);
    }

    const data = await res.json();
    const raw = data?.content?.[0]?.text || "";
    const parsed = parseDefensif(raw);
    const prog = validerProgramme(parsed, params);
    if (prog.exercices.length === 0) {
      console.warn("[generate] LLM returned no valid exercises, fallback");
      return fallbackProgramme(params);
    }
    return prog;
  } catch (e) {
    console.warn("[generate] LLM call failed, fallback", e);
    return fallbackProgramme(params);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const params: SelectionParams = {
    type: body.type || "hiit",
    competition: body.competition ?? null,
    duree_min: Number(body.duree_min) || 30,
    niveau: body.niveau || "intermediaire",
    format: body.format || "circuit",
    participants: body.participants ? Number(body.participants) : undefined,
  };

  const programme = await genererAvecLLM(params);
  return NextResponse.json({ programme });
}
