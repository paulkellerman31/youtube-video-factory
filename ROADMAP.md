# ROADMAP — améliorations priorisées (ordre 20/80)

> Référence future. RIEN n'est implémenté tant que Théo n'a pas publié et validé quelques
> vidéos. Chaque chantier, le moment venu : implémentation via Claude Code, entrée CHANGELOG,
> non-régression OFM en dry-run avant adoption.

## 0. ✅ Profils multi-chaînes (fait — 2026-06-07)

`references/profiles/<channel>/`, champ `channel` dans project-config, projets rangés par
chaîne, style adaptatif par famille esthétique. Voir CHANGELOG.

## 1. Gains coût triviaux — sans nouveau fournisseur

- **Images : `gpt-image-1-mini` + API Batch OpenAI** → −50 % sur le poste images
  (aujourd'hui ~2,60 $/vidéo de 37 scènes). Qualité à valider sur 2-3 scènes avant bascule ;
  le tier image peut être un champ de profil.
- **Tiering voix par profil** : champs `voice_tier` / `voice_provider` dans `voice-config.json`.
  Premium (ElevenLabs) pour les vidéos héros ; OpenAI TTS ou Google TTS pour le bulk.
  **EN DIRECT chez le fournisseur, jamais via un revendeur d'API.**
  Attention : changer de provider = adapter la génération des timestamps sous-titres.
- **Pool d'assets réutilisables par chaîne** : images génériques récurrentes (ambiances,
  transitions, CTA) mutualisées dans le profil au lieu d'être régénérées par vidéo.

## 2. Sortie automatisée

- **Upload YouTube auto depuis le manifest** : API YouTube Data v3, token OAuth par profil
  (une chaîne = un token). Titre/description/tags/miniature lus depuis le projet.
  **Un seul gate humain « READY TO PUBLISH » par batch** — cohérent avec la doctrine
  un-seul-gate ; la publication reste une décision humaine, groupée.
- **Musique de fond auto avec ducking** : bed musical par chaîne (mood dans le profil),
  sidechain/ducking sous la voix dans `finalMux` (aujourd'hui : mix statique 16 % si un
  fichier est déposé à la main dans `assets/music/`).

## 3. Phase 2 — après validation par les chiffres

- **Clips vidéo IA ciblés** : 2-4 clips de 3-5 s par vidéo (hook + moments clés), le reste
  en Ken Burns. Modèles à privilégier : **Seedance Fast (~0,022 $/s)** ou **Veo 3.1
  (~0,03 $/s)**. **PAS Kling** (devenu premium). Le type `AI_VIDEO` existe déjà dans la
  pipeline (désactivé) — l'activer scène par scène via project-config.
- **Analytics YouTube → presets** : remonter CTR / rétention / vues par vidéo depuis l'API
  Analytics et les rapprocher des choix (format, antagoniste, miniature, chaîne de style).
  Les données **INFORMENT** les ajustements de presets — **aucune auto-modification par le
  skill : l'humain décide**, le CHANGELOG trace.

## Hors scope explicite (pour mémoire)

- Pas d'industrialisation supplémentaire tant que des vidéos publiées n'ont pas validé le
  format (qualité, CTR, rétention).
- Toute modification systémique passe par les presets/profils versionnés — jamais par vidéo.
