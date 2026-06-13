# Preset Hyperframes — scènes GRAPHIC animées (texte net, $0)

Hyperframes rend une composition HTML/CSS+GSAP en clip MP4 **en local** (Chrome headless + ffmpeg),
coût API zéro. C'est le renderer **par défaut des scènes `GRAPHIC`** (data, chiffres, comparatifs,
mécaniques) : gpt-image-1 ne sait pas écrire, hyperframes si. Le texte est net, animé, exact.

## Quand router une scène en `hyperframes`
- Scène **GRAPHIC** : funnel, barres, courbe, jauge, comparatif, compteur, break-even, timeline.
- Toute scène où **des mots/chiffres précis sont porteurs de sens** et ne sont ni une capture
  (`screen_capture`/`manual_asset`) ni un simple overlay sur image abstraite.
- Pas pour les scènes concept/narration → restent `ai_image`.

## Déclaration (image-prompts.json)
```json
{ "sceneId": "s20", "source": "hyperframes", "hyperframes": { "fps": 30, "quality": "standard" } }
```
La composition vit dans `hyperframes/<sceneId>/index.html` (versionnée avec le projet).
Pas de `prompt` nécessaire. Un `textOverlay` éventuel est ignoré (le texte vit dans le HTML).

## Contrat technique de la composition (index.html)
- **Autonome**, 1920×1080, `data-resolution="landscape"`. Seul asset externe autorisé : GSAP via CDN.
  **Aucune** image/police externe (rendu déterministe, hors-ligne). Polices système uniquement.
- Élément racine obligatoire :
  ```html
  <div id="root" data-composition-id="main" data-start="0" data-duration="N"
       data-width="1920" data-height="1080"> … </div>
  ```
- Une timeline GSAP **paused** exposée sur `window.__timelines["main"]` :
  ```js
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  /* … animations … */
  window.__timelines["main"] = tl;
  ```
- `data-duration` (secondes) ≈ la fenêtre audio de la scène (l'assemble conforme le clip à la durée
  exacte ; viser la durée audio évite un ralenti/accéléré visible). Voir les fenêtres dans
  `project-config.json` (`audioStart`/`audioEnd`).
- **30 fps** (doit matcher l'assemble). `quality: "standard"` par défaut, `"high"` si dégradés/glow lourds.

## Charte = DA du PROJET (jamais en dur)
La DA dépend de la chaîne. **Chaque compo démarre par le bloc `:root` de sa chaîne**, copié depuis
`references/profiles/<chaîne>/hyperframes-tokens.css` (compo autonome → on inline les tokens, pas
d'import externe au rendu). On style ensuite avec les variables (`var(--bg)`, `var(--accent)`…) — JAMAIS
de HEX en dur. Changer de chaîne = changer le bloc tokens, la structure reste.

- **ofm** : dark luxury tech, navy + bleu `#00C8FF`, glow discret, gros chiffres. Texte clair sur sombre.
- **corps-humain** : cartoon plat TED-Ed, fond crème clair + teal/corail, **aucun glow**. Texte sombre sur clair.
- **rome-antique** : marbre/bronze, or chaud sur ombre, serif gravé, frises/parchemin (HEX provisoires).

Base de départ : `references/hyperframes/template-ofm.html` (exemple ofm) + les tokens de la chaîne visée.

## Règle dure
- Le texte/chiffre affiché doit être **exact** (issu du script/voiceover de la scène). Pas de chiffre inventé.
- Une seule idée par compo : un graphe = un message. Lisible sur mobile (gros, contrasté).
