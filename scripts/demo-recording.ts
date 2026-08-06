/**
 * Démo : filmer un site d'outil comme si tu l'enregistrais à l'OBS.
 *
 * Lancer :  double-clic sur demo-recording.bat  (ou `npx tsx scripts/demo-recording.ts`)
 * Sortie :  demo-<slug>.mp4 à la racine du dépôt.
 *
 * Ce script appelle le VRAI module `lib/recording.ts` de la pipeline — ce que tu vois dans le
 * mp4 est exactement ce que produira une scène `source: "screen_recording"` d'une vidéo.
 *
 * Pour tester un autre outil : changer URL et BEATS ci-dessous, rien d'autre.
 */
import { screenRecording } from "./lib/recording.js";

const URL = process.env.DEMO_URL ?? "https://botpenguin.com/";
/**
 * DEMO_AUTH=1 -> filme la session connectée du profil .chrome-record (voir contrat §4-bis).
 * Aucun `click` n'est possible dans ce mode : le moteur refuse, par conception.
 */
const AUTH = process.env.DEMO_AUTH === "1";
const SLUG = URL.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "");

/**
 * Les beats, c'est le "scénario souris". Un beat = un geste + sa durée en ms.
 *   settle / dwell            → on ne bouge pas, la page se lit
 *   moveTo   {x,y} | selector → le curseur y va, en courbe, avec dépassement puis correction
 *   scrollTo {y}   | selector → défilement amorti (plafond 900 px/s)
 *   hover    selector         → moveTo + maintien, déclenche l'état de survol réel
 *   click    selector         → onglet, accordéon, bascule mensuel/annuel UNIQUEMENT
 *
 * Sans connaître le DOM du site, on pilote en coordonnées : c'est robuste partout.
 * Avec les sélecteurs du site, c'est plus précis (le curseur vise vraiment le bouton).
 */
/** Parcours dashboard : lecture seule, aucun clic — scroll et survol uniquement. */
const AUTH_BEATS = [
  { do: "settle" as const, ms: 1400 },                // le SPA finit de charger ses données
  { do: "moveTo" as const, x: 720, y: 380, ms: 900 }, // le curseur entre dans le cadre
  { do: "dwell" as const, ms: 1100 },                 // on laisse lire le haut du dashboard
  { do: "scrollTo" as const, y: 520, ms: 1800 },      // descente courte
  { do: "moveTo" as const, x: 520, y: 460, ms: 800 }, // on pointe une carte
  { do: "dwell" as const, ms: 1300 },
  { do: "scrollTo" as const, y: 1100, ms: 1800 },
  { do: "dwell" as const, ms: 1400 },
];

const BEATS = [
  { do: "settle" as const, ms: 900 },                 // la page finit de se poser
  { do: "moveTo" as const, x: 700, y: 420, ms: 900 }, // le curseur entre dans le cadre
  { do: "dwell" as const, ms: 700 },                  // on laisse lire le hero
  { do: "scrollTo" as const, y: 900, ms: 2200 },      // descente lente vers les features
  { do: "moveTo" as const, x: 460, y: 500, ms: 900 }, // on pointe une carte
  { do: "dwell" as const, ms: 900 },                  // le survol s'allume
  { do: "scrollTo" as const, y: 1900, ms: 2200 },     // suite de la page
  { do: "moveTo" as const, x: 980, y: 430, ms: 800 },
  { do: "dwell" as const, ms: 1200 },
];

const out = `demo-${SLUG}.mp4`;
console.log(`Enregistrement de ${URL} …`);
console.log(
  AUTH
    ? "Mode authentifié : profil .chrome-record, sans fenêtre. Ton écran reste libre.\n"
    : "Une fenêtre Chrome ne s'ouvrira pas : le navigateur tourne en arrière-plan.\n",
);

await screenRecording(
  {
    url: URL,
    viewport: "1440x810",
    cursor: true,
    plannedDurationSec: 11,
    auth: AUTH,
    beats: AUTH ? AUTH_BEATS : BEATS,
  },
  out,
);

console.log(`\n✅ Terminé — ouvre ${out}`);
console.log("Ce que tu dois voir : le curseur qui entre en courbe, ralentit, dépasse légèrement");
console.log("sa cible puis se corrige ; le scroll qui s'amortit ; les éléments qui s'allument au");
console.log("survol. Les 2 premières secondes de chargement sont déjà coupées automatiquement.");
