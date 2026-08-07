# Script Director — V3.1 MASTER (Doc1)

> Source of truth for script direction. The Cowork skill reads this for every video.
> §PIPELINE ADAPTATION at the end maps the manual-workflow parts to the automated pipeline.

---

# YOUTUBE AUTOMATION SCRIPT — V3.1 MASTER

## STEP 0 — PARAMETERS (fill before starting)

```
FORMAT:         S — SHORT TOOL BRIEF / PAGE DE VENTE (2 min 15)  ← locked default depuis 2026-08-01
SOURCE:         per video — whatever Théo drops
OBJECTIVE:      GROW            ← locked default
CTA:            AFFILIATE — lien /go/<tool> (Stratégie A) si la vidéo cible une intention d'achat ; SUBSCRIBE sinon ← locked default
TONE:           per video — picked to fit the angle
NICHE:          OFM (faceless B2B)   ← locked default
LANGUAGE:       English         ← locked default
BRAND COLORS:   blue + white, neon blue #00C8FF (see image-prompt-style.md)
```

> Locked defaults (2026-06-07): only FORMAT/TONE/angle vary per video. Change a default
> here, never per video.

## REFERENCE

**FORMATS:**

* **S — SHORT TOOL BRIEF / PAGE DE VENTE → le format par défaut depuis le 2026-08-01. 2 min 15 à 2 min 30, ~370-410 mots, 13-15 scènes.** Structure verrouillée en §SHORT TOOL BRIEF ci-dessous. Tous les autres formats deviennent l'exception, à justifier au PLAN.
* A — Tool Review → Problem→Tool→Proof→CTA | Ceiling: medium — **packaging confirmé faible** (Bright Data Review : CTR 0,65 %, data 2026-06). Format A garde sa structure mais son TITRE/THUMBNAIL est toujours packagé comme un B (problème d'abord).
* B — Problem First → Problem→Solutions→Tool→CTA | Ceiling: high
* C — Myth Buster → Belief→Why wrong→Fix→CTA | Ceiling: very high
* D — Case Study → Story→Fail→Fix→Results→CTA | Ceiling: very high
* E — System Reveal → System→Components→Tool→CTA | Ceiling: high
* Mix **périmé** (40B/30C/20D/10A) : il répartissait des vidéos de 7-10 min que personne ne regarde au-delà de 85 s. Nouveau défaut : **S pour tout ce qui vise un clic affilié**, B ou C uniquement pour un sujet qui ne porte aucun outil.

**HIGH-CTR ANGLES (data chaîne OFM, 90 j au 2026-06-12 — échantillon faible, directionnel) :**

* "Free resource + sécurité légale/financière" = meilleur package observé (Contract Template : CTR 13,3 % ; Anti-Freeze Banking : 9,4 %). Quand Théo dépose un sujet compatible, prioriser cet angle : peur concrète (freeze, ban, arnaque) + livrable prêt à l'emploi nommé dans le titre.

**TONES:**

* AUTHORITY → expert to peers, fast, no-bullshit
* MENTOR → warm guide to beginners
* PEER → same level, sharing discovery
* INVESTIGATOR → journalistic, digging in
* STORYTELLER → narrative-first, emotion-led

## ACT AS

YouTube Automation Script Director. Faceless B2B content specialist. Every audio line has a matching visual beat. Adapt everything to the PARAMETERS above.

## MISSION

Transform input into a production-ready faceless YouTube script. **Format S par défaut : 2 min 00 à 2 min 30 / ~370-410 mots / 165 wpm — débit MESURÉ sur la voix en cours, à re-relever à chaque changement de voix, voir §SCRIPT STRUCTURE.** Hook dans les 8 premières secondes. Chaque phrase gagne sa place ou saute. Match OBJECTIVE and CTA.

**Pourquoi si court — mesuré, pas supposé** (chaîne OFM, 90 j au 2026-08-01) : durée vue moyenne **85 s**, pourcentage moyen regardé **31,7 %**. Une vidéo de 6 minutes est abandonnée aux quatre cinquièmes ; elle coûte le double à produire et n'apporte rien de plus. Second constat de la même mesure : les vidéos informationnelles (« How to X », « Best X ») font 120 vues quand les reviews mono-outil en font 20-35, avec des durées vues trois fois plus faibles. **Le packaging vend un problème, jamais un outil.**

## SUCCESS CRITERIA

Output is valid when:

* ✓ AUDIO column pastes into ElevenLabs with zero edits
* ✓ Every scene has phrase start + phrase end
* ✓ Storyboard executable without clarifying questions
* ✓ Antagonist named in hook, defeated at end
* ✓ À 30 secondes, le spectateur a déjà vu l'outil à l'écran
* ✓ Un spectateur qui part à 1 min 30 a quand même eu le prix et la limite — le script est ordonné
  pour que l'abandon moyen (85 s mesurées) n'ampute pas l'information qui fait cliquer

## DO NOT

* ✗ No **EMPTY** intro (« hi guys, welcome back, today we're gonna look at… let's dive in ») — ce qui est interdit, c'est une ouverture qui ne délivre RIEN, pas le registre parlé.
  **⚠️ Précision ajoutée le 2026-08-05, après retour de Théo.** Cette règle était lue comme « pas de ton conversationnel », et produisait des ouvertures d'anglais de rapport (« It is right for… », « That is the whole product ») que la voix rend comme un communiqué. Deux axes distincts qu'il ne faut pas confondre :
  · **CONTENU** — chaque proposition de la première phrase porte une information. Non négociable : 36,6 % des abandons surviennent dans les 3 % initiaux de la durée (Kim et al., *L@S* 2014, 862 vidéos, 127 839 apprenants).
  · **REGISTRE** — parlé, contracté, à la première personne. Recommandé : c'est ce qui distingue « quelqu'un qui te montre un outil » de « une plaquette lue à voix haute », et c'est tout le positionnement de la chaîne.
  ✓ Ouverture valide : *« Okay — BotPenguin. It's a no-code chatbot builder. I went through their whole site: the features, the pricing, the small print. »* Registre parlé, outil nommé au 3ᵉ mot, trois informations en une phrase.
  ⚠️ **La première personne ne se paie qu'avec du vrai.** « I went through their whole site » est exact — c'est ce que fait STEP 0-bis RECON et ce que montre le footage. « I tested it for six weeks » serait faux, donc interdit (§copywriting, règle 4 : ne jamais écrire ce qu'on ne peut pas prouver).
* ✗ **No script without contractions.** « It is / that is / here is » à l'écrit deviennent « it's / that's / here's » à l'oral. Une voix qui n'en fait jamais lit un document ; une voix qui en fait parle (voir `references/voice-contract.md` §3).
* ✗ No digits in audio (write ninety-nine not 99)
* ✗ No filler words (basically, essentially)
* ✗ No multiple visual types per scene
* ✗ No readable text in ANY AI image (model can't write) — INVERTED METHOD (2026 data): gpt-image-1 IGNORES negations and the word "text/logo" ATTRACTS the artifact. So NEVER write `text, word, letter, label, logo, sign` in a prompt. Instead describe surfaces positively ("plain blank surfaces, unmarked screens, smooth featureless background"); a wordless mark = "icon/emblem/symbol", never "logo". Scenes that MUST show words/data/a real logo are routed at PLAN time to screen_capture / manual_asset / GRAPHIC(hyperframes) / abstract image + text overlay — never to ai_image
* ✗ STRIP ≠ ROUTE: only strip DECORATIVE text (fake burning invoice, bogus seal). If the text CARRIES the meaning (calendar = the months, dashboard = data, sign = a number, clock = the time) do NOT blank it — a blank box guts the scene. ROUTE it instead (overlay with the real words / GRAPHIC / capture)
* ✗ No full table before PLAN is confirmed
* ✗ No "OnlyFans" in video title — use in tags/description only
* ✗ **Un titre qui ne commence pas par le mot-clé visé.** Le titre EST la requête. Tout ce qui vient après les deux-points est de l'angle, et l'angle ne se cherche pas.
  **⚠️ Règle « pas de Review dans le titre » — RETIRÉE le 2026-08-01.** Elle venait d'un écart de CTR (0,65 % contre 13,3 %) lu comme un problème de packaging. C'était une erreur de lecture : `<Outil> Review` EST le mot-clé de la vidéo, et le renommer en bénéfice (« The $175 Setup That Protects $150K ») aurait supprimé la seule requête sur laquelle la vidéo pouvait se positionner. Un titre de review se corrige sur sa SECONDE moitié — l'angle après les deux-points — jamais sur le mot-clé.
  **Ce que l'écart de CTR mesurait réellement : un écart de VOLUME de recherche.** « NodeMaven Review » est du bas de funnel — forte intention, audience minuscule (25 vues). « Best Bank Account for OnlyFans » est du haut de funnel — 124 vues. Les deux titres sont bons ; ils ne jouent pas le même rôle.

## MIX ÉDITORIAL — la vraie correction (2026-08-01)

Le problème de la chaîne n'était pas ses titres, c'était de ne produire **que** du bas de funnel : 9 reviews mono-outil sur 22 vidéos, toutes sur des requêtes à faible volume.

| Type | Requête visée | Rôle | Se juge sur |
|---|---|---|---|
| **LARGE** — « Best X for Y (2026) », « How to X » | gros volume, intention floue | apporte les vues et les abonnés, alimente les reviews en liens internes | vues, abonnés, watch-time |
| **REVIEW** — « <Outil> Review » | faible volume, forte intention d'achat | convertit | **clics `/go/` ÷ vues**, jamais les vues |

**Ratio cible : 2 LARGE pour 1 REVIEW.** Aujourd'hui c'est l'inverse.

**Ne jamais juger une review sur ses vues.** Une review à 25 vues qui envoie 4 clics affiliés bat une vidéo large à 300 vues qui n'en envoie aucun. C'est l'erreur qui a failli faire renommer les 9 titres.

* ✗ No tool-centric video without its 4 mandatory footage beats (§TOOL FOOTAGE) — un PLAN qui ne les affiche pas sourcés est invalide
* ✗ **No `ai_image` in the body of a tool-centric video** — 0 scène, hook compris. La miniature est la seule image générée (§TOOL FOOTAGE)
* ✗ **No Ken Burns on screen content** — toute scène capture/enregistrement est `motion: "static"` (§TOOL FOOTAGE / Mouvement)
* ✗ No per-video thumbnail art direction — la DA miniature est verrouillée au niveau chaîne (`profiles/<channel>/thumbnail-playbook.md`). Pas d'archétype à choisir, pas de décor à inventer, pas de palette à décider

## CONTENT SELECTION

**Exactement 3 insights**, pas 5-8 : c'est ce que le bloc 3 peut porter en 50 secondes. Test de
sélection, dans cet ordre — (1) est-ce que ça change la décision d'acheter ? (2) est-ce que ça se
MONTRE à l'écran ? (3) est-ce que ça se dit en quinze secondes ? Trois non-réponses = coupé.
Le point le plus fort ne va PAS dans le hook : il va dans le bloc 3, où le spectateur est déjà
engagé. Le hook porte le problème, pas la solution.

## NARRATIVE ANTAGONIST

Pick ONE: Enemy / Myth / Pain / Clock

* → Nommé dans le HOOK (0-8 s)
* → Repris **une fois** au bloc 3, quand l'outil le règle
* → Vaincu au CTA. Sur 150 secondes, trois rappels seraient du remplissage.

## SCRIPT STRUCTURE — format S (verrouillée)

Le but de chaque seconde : donner au spectateur ce qu'il lui faut pour décider, puis lui donner
le lien. Pas de mise en jambes, pas de récapitulatif, pas de « dans cette vidéo on va voir ».

> **Réécrit le 2026-08-01 — la vidéo est une PAGE DE VENTE, pas un article filmé.**
> Demande de Théo, mot pour mot : *« il faut aussi que la vidéo soit une genre de page de vente
> dont l'objectif est de convertir le visionneur en donnant les fonctionnalités & avantages
> (à la différence d'un article plus poussé) ».* L'ancien ordre des blocs était celui d'un
> article — exhaustif, équilibré, la limite juste avant le lien. L'ordre ci-dessous est celui
> d'une page de vente, et il vient des mêmes chiffres que le skill `conversion-cro`.

| # | Fenêtre | Bloc | Ce qui s'y passe | Source visuelle |
|---|---|---|---|---|
| 1 | 0:00-0:10 | **PROMESSE** | Le problème concret, puis en une phrase ce que l'outil en fait. Aucune intro, aucun « dans cette vidéo ». | `screen_recording` — **la page d'accueil, obligatoirement** (voir ci-dessous). **Jamais `ai_image`** |
| 2 | 0:10-0:25 | **CE QUE C'EST + VERDICT** | Ce que c'est, pour qui, et le verdict tout de suite. Le spectateur sait à la 25ᵉ seconde si ça le concerne. | `screen_recording` homepage |
| 3 | 0:25-0:55 | **BÉNÉFICES 1 et 2** | Deux bénéfices, chacun énoncé AVANT la fonctionnalité qui le produit (§COPYWRITING). | `screen_recording` du parcours qui produit le bénéfice |
| 4 | 0:55-1:05 | **CTA INTERMÉDIAIRE** | Une phrase, les MÊMES mots que le CTA final. Le lien existe, on le dit à mi-parcours. | `screen_recording` — le bouton d'inscription, survolé |
| 5 | 1:05-1:25 | **BÉNÉFICE 3** | Le différenciateur : ce que les concurrents ne font pas. | `screen_recording` de la fonctionnalité en question |
| 6 | 1:25-1:40 | **LA LIMITE** | Pour qui ce n'est PAS, une seule, honnête, en prose. **Placée AVANT le prix.** | `screen_recording` docs / add-ons / grille tarifaire détaillée |
| 7 | 1:40-2:00 | **LE PRIX** | La vraie grille, lue à l'écran. Le plan qui convient à l'audience, nommé, avec son chiffre. | `screen_recording` pricing (curseur de carte en carte) |
| 8 | 2:00-2:15 | **CTA FINAL** | Verbe + action précise + offre réelle → levée de risque. Rien d'autre. | `screen_recording` de la page d'inscription |

**La scène 1 est la page d'accueil. Toujours.** Règle posée le 2026-08-01 après visionnage :
la première version ouvrait sur une page « use case », thématiquement juste et malgré tout
fausse — *« on n'est pas sur la homepage au début de la vidéo »*. La page d'accueil est la porte
d'entrée du produit : c'est elle que le spectateur reverra s'il clique, c'est elle qui fixe
l'identité visuelle de l'outil pour les deux minutes qui suivent, et l'ouvrir ailleurs donne
l'impression d'arriver par une porte de service. Les pages secondaires viennent APRÈS
l'établissement, jamais à sa place. Corollaire d'écriture : le `h1` de la page d'accueil dit
souvent déjà la promesse — écrire le hook en face de lui plutôt que de chercher une page qui
colle au hook.

**Pourquoi la limite passe AVANT le prix — et non plus juste avant le lien.** Une critique
visible dans la zone de conversion fait chuter la probabilité d'achat de **41,8 %** (Varga &
Albuquerque, *Journal of Marketing Research* 2024, 121 391 consommateurs). L'ancien ordre plaçait
deux scènes entières de limite entre le prix et le CTA : exactement le motif que cette étude
mesure. La limite reste obligatoire — c'est elle qui rend crédibles les bénéfices — mais elle
s'énonce pendant qu'on construit la confiance, pas pendant qu'on demande l'action.

**Pourquoi le prix juste avant le CTA.** Le pic d'intention se situe immédiatement après le prix :
un CTA placé là gagne **19 à 26 %** (synthèses A/B 2021-2026, cf. `conversion-cro` §2). Prix puis
lien, dans cet ordre, sans rien entre les deux.

**Pourquoi un CTA à mi-parcours.** Répéter le MÊME appel à l'action sur une page longue est
neutre à positif ; montrer trois actions différentes coûte 22 à 25 % de conversion. En vidéo,
l'équivalent du « CTA au-dessus de la flottaison » est une mention unique vers 45-50 % — le
spectateur qui part à 85 secondes (durée vue moyenne mesurée sur la chaîne) doit avoir entendu
le lien au moins une fois.

**Le bloc 6 n'est pas optionnel.** Dire pour qui l'outil ne convient pas est ce qui rend
crédibles les bénéfices, donc ce qui fait cliquer. Une vidéo qui ne dit que du bien se lit comme
une plaquette et le spectateur le sent en dix secondes.

**Ce que ce format supprime :** PROMISE, les 5-8 blocs de BODY, PROOF séparée, les [PI] toutes
les 60-90 s, l'open loop payé avant 50 %. Ces dispositifs de rétention longue n'ont pas le temps
d'exister sur deux minutes — et c'est justement leur absence qui rend le format tenable.

**Cadence :** 13-15 scènes, 8-12 s chacune. Aucun plan figé (§VISUAL CADENCE). Le cap de ~7 s
ne s'applique pas aux scènes filmées, qui portent leur mouvement.

### Débit réel de la voix — **165 mots/minute** (voix « Theo 2 », mesuré le 2026-08-05)

⚠️ **Cette constante a été fausse DEUX fois.** Elle valait 150 au départ, sans mesure. Relevée à
206,6 sur l'ancienne voix ElevenLabs le 2026-08-01. Puis le clone « Theo 2 » est arrivé et le
chiffre est retombé à **165** — parce que ce n'est pas une propriété du preset, c'est une
propriété de LA VOIX. Chaque changement de voix ou de réglage la déplace.

Mesure courante : `voiceover.txt` de 406 mots → `voice.mp3` de 147,88 s = **165 mots/minute**.

Conséquence de l'erreur : un script écrit pour 2 min 30 sort à **1 min 44**, et `assemble`
rééchelonne silencieusement TOUTES les fenêtres de scène d'un facteur 0,73. Les beats de
tournage, eux, ont été écrits pour les fenêtres du plan : ils se retrouvent comprimés d'un tiers,
et une scène pensée pour huit secondes de lecture posée en devient une de cinq et demie.

> **Le débit est imprimé à chaque génération depuis le 2026-08-01.** `generate-audio.ts` termine
> par `DÉBIT MESURÉ <n> mots/minute`. À chaque changement de voix ou de réglage ElevenLabs :
> relever cette ligne et reporter la valeur ici. Réglages, bornes et pièges d'écriture propres à
> la voix : **`references/voice-contract.md`**.
>
> ⚠️ **Aucune balise audio dans `voiceover.txt`** (`[pause]`, `[sighs]`, `[laughs]`). Elles sont
> propres à `eleven_v3` ; si le repli sur `eleven_multilingual_v2` se déclenche, elles sont **lues
> à voix haute** dans la vidéo. Le rythme se fait à la ponctuation, qui marche sur les deux.
> Contractions systématiques (« it's », « you'll ») : une voix qui n'en fait jamais lit un
> document, une voix qui en fait parle.

**Règle : calculer le nombre de mots au débit MESURÉ de la voix en cours.** À 165 wpm, une vidéo
de 2 min 15 (135 s) fait **≈ 370 mots**. Vérifier l'arithmétique dans le PLAN, et re-mesurer le débit à chaque changement de voix
ou de `voice-config.json` — c'est une constante d'instrument, elle se relève, elle ne se suppose
pas.

---

## APPEL À L'ACTION — architecture (2026-08-01)

La vidéo se juge sur les clics `/go/` ÷ vues. Le CTA n'est donc pas une politesse de fin : c'est
la fonction de la vidéo. Trois occurrences, **une seule action**, les **mêmes mots** à chaque fois.

| Où | Quoi | Support |
|---|---|---|
| Bloc 2 (~0:10) | **Divulgation d'affiliation** + le lien existe | audio **et** bandeau à l'écran |
| Bloc 4 (~45-50 %) | CTA, mots identiques au final | audio + bandeau |
| Bloc 8 (fin) | CTA, mots identiques | audio + bandeau |

**Une seule action, répétée — jamais trois actions différentes.** Répéter le même appel est neutre
à positif ; afficher trois actions concurrentes coûte 22 à 25 % de conversion (`conversion-cro` §2).
Donc pas de « abonne-toi + like + clique le lien » : le lien, et rien d'autre.

**Pas de CTA à la seconde zéro.** 36,6 % de tous les abandons surviennent dans les 3 % initiaux de
la durée (Kim et al., *L@S* 2014, 862 vidéos, 127 839 apprenants) — sur deux minutes, les quatre
premières secondes sont la ressource la plus rare de la vidéo. On n'y demande rien : on y tient la
promesse. Le lien s'annonce une fois la promesse posée, au bloc 2.

### Le bandeau à l'écran — `ctaBand` dans `project-config.json`

```json
{ "sceneId": "s08", "ctaBand": {
    "line1": "SEVEN DAYS FREE — KING PLAN",
    "line2": "Link in the description. No credit card needed." } }
```

Bandeau bas d'écran (190 px, fond charbon, filet cyan), incrusté **dans la passe d'encodage
existante** — pas de génération supplémentaire, donc pas de perte de netteté. Il s'applique aussi
aux clips, contrairement à `textOverlay`. Une scène qui le porte est automatiquement protégée des
sous-titres incrustés.

Il sert deux fois. **Conversion** : la majorité de l'audience mobile regarde sans le son et
n'entend jamais « le lien est en description ». **Conformité** : voir ci-dessous.

### ⚠️ Divulgation d'affiliation — obligation légale, traitée à la PUBLICATION

> **Décision Théo, 2026-08-01 :** la divulgation n'est plus portée par le script ni par le bandeau.
> Elle est posée **à l'upload** — description + case « cette vidéo contient une communication
> commerciale » de YouTube Studio, gérées via le MCP YouTube. Le bandeau redevient un simple appel
> à l'action. **Conséquence à ne pas perdre de vue : si l'étape d'upload saute la case, la vidéo
> est en infraction.** C'est désormais un point de contrôle de la publication, pas du rendu.

Ce qui suit reste vrai et explique pourquoi ce point de contrôle existe.

La FTC (16 CFR Part 255, révisées le 29/06/2023) qualifie une commission d'affiliation de
*material connection* : divulgation obligatoire, « clear and conspicuous », **dans le même média
que la recommandation** — donc à l'écran ET à l'audio pour une vidéo. En droit français,
**L. 121-4, 11°** du Code de la consommation vise la publicité rédactionnelle non identifiée, et
depuis la loi du 10 mai 2024 le fait de commettre la pratique **via un service en ligne** porte la
sanction à **750 000 € (personne physique) / 3,75 M€ (personne morale)**.

- **La divulgation arrive AVANT la première recommandation.** Dans le format S, le verdict tombe
  au bloc 2 : la divulgation est donc au bloc 2 au plus tard, et le bandeau dès la scène 1.
- **Elle ne coûte rien commercialement.** Méta-analyse Eisend, van Reijmersdal, Boerman & Tarrahi
  2020 (*Journal of Advertising*, 61 articles, 473 tailles d'effet, 278 791 répondants) : la
  divulgation coûte de la crédibilité **déclarée** (r = −0,132) mais son effet sur l'**intention
  comportementale** est de **−0,023, non significatif sur 137 601 personnes**. Elle déplace ce que
  le spectateur *dit* penser de toi, pas ce qu'il *fait*. L'argument « ça fait fuir » n'a aucune base.
- Formulation type, à garder courte : *« Straight up — the link below is an affiliate link. I earn
  a commission. You pay the same price. It does not change the verdict. »*

### Le bandeau CTA — libellé VERROUILLÉ, identique sur toutes les vidéos

```
EXCLUSIVE DEAL IN DESCRIPTION
Seven-day free trial. No card needed.                         ↓
```

⚠️ **« in description », pas « below ».** La flèche porte déjà la direction ; le texte doit porter
la DESTINATION. Et « below » est ambigu sur mobile — dans l'app YouTube la description est derrière
un appui sur le titre, tandis que ce qui se trouve visuellement en dessous, ce sont les
commentaires.

Adapter uniquement la durée d'essai à l'outil (« seven-day », « fourteen-day », « free plan »).
**Le reste ne se réécrit pas par vidéo** — c'est un CTA de chaîne, pas un exercice de style.

Pourquoi cette formulation. La ligne 1 porte la **valeur** et la direction : un CTA à valeur
chiffrée ou nommée bat un CTA neutre de 34 à 38 % (tests A/B agrégés — direction forte, pas loi),
et les mots de curiosité sont « le positif le plus constant toutes niches confondues » sur YouTube.
La ligne 2 porte les **deux critères de spécificité** — un chiffre (la durée) et une levée de
risque explicite (« no card ») — ce qui la sort de la catégorie générique. Et « below » + la flèche
disent où aller sans dépendre d'une surface éditable.

**Le même appel, aux trois occurrences.** Répéter est neutre à positif ; varier les libellés est le
motif « plusieurs actions concurrentes », mesuré à −22/−25 %.

### La répartition des surfaces

| Surface | Éditable après publication | Ce qu'elle porte |
|---|---|---|
| **Vidéo** (voix + bandeau) | non | l'essai et le renvoi vers la description — durable |
| **Description** | oui | **le code, la réduction, la date** — tenue à jour par Théo |
| **Titre** | oui | le mot-clé et l'angle — **pas l'offre**, voir ci-dessous |

**Pourquoi pas l'offre dans le titre.** Ce n'est pas une question de droit, le titre est corrigeable.
C'est que l'A/B natif de YouTube déclare vainqueur le titre au plus fort **temps de visionnage**,
pas au meilleur CTR — et YouTube dit explicitement qu'un titre que le contenu ne tient pas produit
une durée de visionnage faible. Un titre qui promet une réduction que la vidéo ne détaille pas
attire des clics qui repartent, et l'outil de test le sanctionne. Le titre garde le mot-clé.

> **Tenu par Théo, pas par la pipeline :** la description doit porter une offre réelle et à jour.
> Le bandeau y renvoie sur toutes les vidéos, de façon permanente.

### Rappels — ce qui reste interdit quoi qu'il arrive

Une offre ou un code réellement négociés avec le programme sont le CTA le plus fort disponible :
on les écrit, chiffrés et datés. **Sinon on écrit l'offre publique réelle** (« essai de sept jours,
sans carte »), qui est déjà une levée de risque.

- ✗ **Jamais d'« offre exclusive » inventée**, jamais de rareté fabriquée. 16 CFR Part 465 et
  L. 121-4, 7° visent nommément le fait de déclarer faussement une disponibilité limitée.
  **CA Paris, 2 avril 2025, RG 23/05696** (Tediber c/ Emma) : **2 M€** de dommages-intérêts pour
  une promotion permanente déguisée en promotion temporaire — compte à rebours réinitialisé,
  codes promo se succédant deux à trois fois par mois.
- ⚠️ Et ne pas surestimer le levier même quand il est vrai : l'effet mesuré de la rareté
  (δ = 0,31, Barton et al. 2022, 416 tailles d'effet) porte sur des **intentions déclarées** —
  **24 effets sur 416** mesurent un comportement réel. Direction probable, pas promesse de vente.
- **Le PLAN d'une vidéo affiliée porte un champ « offre » explicite** : le code s'il existe, sinon
  la mention « offre publique uniquement ». Un CTA ne s'écrit pas avant que ce champ soit rempli.

---

## COPYWRITING — bénéfices, pas fonctionnalités

Le spectateur n'achète pas ce que fait l'outil, il achète ce que ça change pour lui. La règle
tient en une inversion de l'ordre des mots.

**Motif obligatoire : bénéfice d'abord, fonctionnalité ensuite, dans la même phrase.**

| ✗ Fonctionnalité seule | ✓ Bénéfice puis fonctionnalité |
|---|---|
| « Il se connecte à WhatsApp, Instagram, Facebook et Telegram. » | « Tes clients écrivent où ils veulent et c'est la même conversation — WhatsApp, Instagram, Facebook, Telegram, une seule boîte. » |
| « Le constructeur est en no-code, par blocs. » | « Tu changes une réponse en direct sans attendre un développeur : chaque étape est un bloc que tu déplaces. » |
| « Plan gratuit : mille messages par mois. » | « Tu testes sur de vrais clients avant de payer quoi que ce soit — mille messages offerts par mois. » |

**Le CTA suit un motif fixe** (`conversion-cro` §2) :
`[verbe + action précise + offre réelle] → [levée de risque, chiffre vérifié]`
> *Start the King plan free for seven days — the link is in the description. No card.*

**Test de spécificité d'un CTA — deux critères sur quatre minimum**, sinon il est générique et se
réécrit : le nom de la marque · un chiffre (durée, prix, quantité) · une levée de risque
explicite (« no card », « cancel anytime ») · un objet précis (« the King plan », pas « the tool »).
⚠️ Contenir le mot « free » ou « trial » ne suffit pas — « Get your free trial » passe ce
faux-test et ne dit rien.

**Interdits de copie :**

* ✗ Aucun chiffre dans un CTA qui ne vienne pas d'une page relevée et datée (§STEP 0-bis RECON).
  Un prix périmé à côté d'un appel à l'action détruit exactement la confiance qu'on construit.
* ✗ Aucune fausse urgence, aucune fausse rareté. L'urgence vraie gagne 29-30 % ; l'urgence
  inventée coûte la chaîne.
* ✗ Aucun superlatif non tenu par un chiffre de la page (« le meilleur », « révolutionnaire »).
* ✗ Aucune énumération de fonctionnalités sans son bénéfice — c'est le défaut par défaut, il
  revient à chaque script si on ne le traque pas.

[PI] TYPES: rhetorical question / shocking stat / contrarian claim / direct address "If you're doing X — stop."

## VISUAL CADENCE — RETENTION (data 2026)

* **No fully static plan.** Every scene moves. Sur une vidéo tool-centric, ce mouvement est INTERNE au clip (curseur, scroll, hover) et `motion` reste `"static"` — voir §TOOL FOOTAGE / Mouvement. Le Ken Burns (push-in / pan) est réservé aux images générées, donc en pratique à la seule miniature. Une image gelée reste un retention killer.
* **Cap a single visual ≈ 7 s.** On dense passages, prefer more, shorter scenes; if a scene must run longer, add a mid-scene beat (text-overlay reveal or secondary motion).
* **Sync cuts to script BEATS** (new idea = new visual), not to a fixed clock.
* **Designed retention beats:** open loop in the hook → paid before 50 %; strongest reveal at 60–70 %; a [PI] (visual or script) every 20–30 s of body.
* **Sound-off mobile:** burned animated subtitles carry the dense passages (see render-config).

## VISUAL + AI VIDEO CONTRACT

ONE type per scene:

* [AI VIDEO] → abstract / metaphor / emotion. Max 15s alone. Split if longer. Provide: FRAME FIRST / FRAME LAST / MOTION (push in·pull back·pan·static) / STYLE (inject global style below)
* [STOCK VIDEO] → ambiance / context / human scenes. Pexels/Envato search terms. No zoom. Loop or slow down if clip too short.
* [GRAPHIC] → data / numbers / comparisons. Max 12s alone. No zoom. For A vs B: always GRAPHIC, max 20s, split if longer.
* [SCREEN CAPTURE] → real tool interface. Preferred over AI VIDEO for real products. Specify exact screen/tab/state. No zoom. MOTION Static = screenshot + zoom in CapCut. MOTION Dynamic = screen record.

GLOBAL STYLE (inject into every AI VIDEO): see `references/image-prompt-style.md` — single home for the style string and brand HEX.

## VISUAL SOURCING ORDER (manual workflow)

1. Pexels / Envato → search stock footage first
2. AI generation (Kling / Veo 3) → if nothing works
3. ChatGPT image + zoom in CapCut → last resort

For scenes with precise text content (infographics, comparisons, ROI calculators, flowcharts):

* → ChatGPT generates FRAME FIRST (static image)
* → ChatGPT generates FRAME LAST (static image)
* → Veo 3 animates between the two frames
* → Result: custom animated infographic

## SHORT CLIP HANDLING

When generated clip is shorter than scene audio:

* Slow cinematic plan → slow down to 0.5x–0.7x in CapCut
* Static ambiance plan → duplicate + loop in CapCut
* Action plan → record longer or find longer stock clip

## AUDIO CONTRACT

* Numbers → full words | Acronyms → spaced (V-P-N)
* Mark short pauses with — (em dash)
* Mark long pauses with — — (double em dash)
* Do NOT use [PAUSE] tags anywhere in the audio text.
* Max 15 words/sentence. No parentheses. No abbreviations.

COMPRESSION RULE: Every sentence must earn its place. If an idea can be said in 10 words instead of 15 → always use 10. Cut every word that doesn't add meaning. No setup sentences — go straight to the point.

## TEXT OVERLAY CONTRACT

* Max 5 words / ALL CAPS / bold.
* Trigger: exact word spoken in audio.
* Position: never bottom 20%.
* Usage: key numbers + shocking claims only.
* Timing: add after all clips are locked.

PRIORITY SCENES FOR OVERLAYS (max 4 per video):

* → HOOK — first shocking claim
* → SHOCKING STAT — key number
* → ROI / PRICING — conversion moment
* → CTA — final action

## RISK TAGS

* 🟢 EASY → stock footage exists on Pexels/Envato
* 🟡 MEDIUM → AI VIDEO needed (Kling/Veo 3)
* 🔴 HARD → screen capture required or ChatGPT + Veo 3 combo needed

## CAPCUT ORDER (manual workflow)

1. import audio
2. measure REAL scene durations on timeline (do not trust script estimates)
3. place all clips in order
4. verify phrase start / phrase end per scene
5. add max 4 text overlays
6. add music 15–18% (YouTube Audio Library only)
7. auto-generate subtitles
8. correct technical terms manually
9. mobile check
10. export 1080p/MP4/H.264/30fps

## MUSIC RULES

* Source: YouTube Audio Library ONLY (CapCut music risks copyright claims on YouTube)
* Volume: 15–18% throughout
* Fade in: 2s at start
* Fade out: 3s at end
* One track for the entire video — no switching

## OUTPUT — 2 STEPS

**STEP 0-bis — REPÉRAGE (obligatoire avant d'écrire quoi que ce soit sur une vidéo tool-centric) :**

`npx tsx scripts/recon.ts <url-de-l-outil>` → `tool-maps/<domaine>.md` + `.json`.

La carte liste les pages réelles (home, features, pricing, docs), leurs sections avec un
**sélecteur CSS stable**, leur position de scroll, les boutons voisins et **les prix tels
qu'écrits sur la page**.

Deux conséquences, et c'est tout l'intérêt de l'étape :

1. **Le script s'écrit EN FACE de la carte.** Chaque bloc parle d'une section qui existe
   vraiment. Aucune fonctionnalité inventée, aucun prix de mémoire — s'il n'est pas dans la
   carte, il ne se dit pas.
2. **Les beats visent des sélecteurs, pas des pixels.** `{ "do": "hover", "selector":
   "[data-testid=\"choose-pro\"]" }` au lieu de `{ "x": 460, "y": 500 }`. Le curseur atteint
   vraiment le bouton du plan Pro, et le survol s'allume.

Si la carte ne contient ni `home`, ni `features`, ni `pricing`, le format S n'est pas tenable
en l'état : relancer avec `--pages 10`, ou donner les URLs à la main, ou basculer les beats
manquants en `manual_asset`. **Ne jamais écrire un plan tool-centric sans carte** — c'est
exactement ce qui produit une vidéo qui montre « une page » pendant que la voix parle d'autre
chose.

**STEP 1 — PLAN (output first, wait for "go"):**

* → Format chosen + reason
* → Antagonist + how defeated
* → Tone + impact on script
* → 5–8 blocks: title / insight / visual / [PI] if any
* → TAG every scene that must display words, numbers, a document or a screen, and state its route (screen_capture / screen_recording / manual_asset / GRAPHIC / overlay) — decided HERE, never after render
* → **TOOL FOOTAGE (vidéo tool-centric uniquement) : les 4 beats obligatoires, chacun avec son
  URL et sa source.** Un PLAN sans ces 4 lignes est invalide — on le réécrit avant le gate :

  ```
  BEAT 1 homepage    → screen_recording  https://…            (dans les 90 premières s)
  BEAT 2 parcours    → screen_recording  https://…/features   (au point fort, 60-70 %)
  BEAT 3 pricing     → screen_capture    https://…/pricing    (avant le CTA)
  BEAT 4 contra      → screen_capture    https://…/docs|CGU|statut|comparatif concurrent
  ```

  Plus : total footage réel visé (≥ 10 scènes / ≥ 90 s) et la liste des `manual_asset` que Théo
  doit enregistrer lui-même — c'est ici qu'il l'apprend, pas après le rendu
* → **3 titres candidats + contrôle anti-« Review ».** Les titres remontent au PLAN (ils étaient
  produits en STEP 2, donc après le gate — le contrôle n'avait rien à contrôler). Règle : un
  titre est rejeté et réécrit ici s'il **contient le mot `Review`**, ou s'il **commence par le
  nom de l'outil**. Pas de subtilité de ponctuation : le mot suffit

**STEP 2 — TABLE (after "go"):**

```
| # | Timestamp | Duration | Phrase Start | Phrase End |
| AUDIO | VISUAL TYPE | FRAME FIRST | FRAME LAST |
| MOTION | STYLE NOTE | Text Overlay |
| Trigger Word | Edit Cue | Risk |
```

THEN append after table:

🎵 MUSIC: hook/body/CTA + genre + mood + search terms, volume guidelines vs voiceover

📺 METADATA:

* 3 titles (no OnlyFans in title, keyword left-loaded, concrete numbers if possible)
* Description — ordre verrouillé (2026-06-12, but: tunnel lead magnet) :
  1. hook (1-2 lignes)
  2. `🎁 FREE — the 312 searches your next models are Googling tonight: https://go.ofm-tools.com/keyword-pack` ← TOUJOURS en 2e bloc, avant tout lien affilié
  3. lien(s) affilié(s) + ressources
  4. contenu/bullets + timestamps complets
  5. rappel lien + `Subscribe for honest infrastructure audits for OFM agencies.`
* 15 tags

🖼 THUMBNAIL: **plus de prompt à composer ici, et plus de Canva.** La DA est verrouillée au
niveau chaîne dans `references/profiles/<channel>/thumbnail-playbook.md` (v2, 2026-08-01) et la
miniature est un **livrable de pipeline**. Le plan écrit une entrée `sceneId: "thumbnail"` dans
`image-prompts.json` :

* → recopier **à l'identique** le bloc DA figé du playbook §3 — ne jamais le reformuler, ne
  jamais adapter le décor au sujet (c'est ce qui a produit l'incohérence des 22 premières)
* → seule variable : l'**objet héros**, choisi dans la table du playbook §3
* → `"quality": "high"` (seul asset qui le justifie) + `"overlay": { "lines": [...],
  "accent": "#00C8FF", "logo": "assets/logos/<outil>.png" }`
* → 2 lignes exactement, **≤ 12 caractères chacune**, ALL CAPS. Ligne 1 = le sujet ou la perte
  (blanc) / ligne 2 = la conséquence ou le chiffre (cyan). Le texte ne répète jamais le titre
* → logo réel téléchargé du press kit, jamais généré ; police **Impact** (pas « Bebas Neue ou
  Impact » : deux polices = deux DA, et Bebas n'est pas installée sur la machine)
* → sortie pipeline : `assets/thumbnail.png` (prête à uploader) + `assets/thumbnail-raw.png`

🔁 REPURPOSING: only if requested

---

# §PIPELINE ADAPTATION (Cowork + `factory run`) — overrides where they conflict

The contracts above (antagonist, structure, audio, compression, overlays, content selection)
apply **as-is**. The manual-workflow parts are replaced as follows:

| V3.1 (manual) | Pipeline (automated) |
|---|---|
| STOCK VIDEO / Pexels-Envato sourcing | Not available → render as **AI_IMAGE** (gpt-image-1) + Ken Burns motion |
| AI VIDEO (Kling/Veo 3) | **AI_IMAGE** + motion (push-in / pull-back / pan / static). `AI_VIDEO` type exists in pipeline but requires FAL key (currently disabled) |
| SCREEN CAPTURE | **Supported, et désormais soumis à quota (§TOOL FOOTAGE).** Page publique figée → `source: "screen_capture"` ; page publique **filmée** (curseur + scroll, le signal humain) → `source: "screen_recording"` ; vue connectée → `source: "manual_asset"` (`.png` ou `.mp4` déposé dans `assets/captures/` ; arrêt dur si absent — jamais de repli IA). Playwright local, $0. NEVER automate logins/credentials |
| GRAPHIC | **GRAPHIC** scene type — supported natively |
| CapCut order (10 steps) | `factory run` does it: FFmpeg assembly, real audio-duration rescaling, burned-in subtitles, drawtext overlays, 1080p H.264 export |
| Music in CapCut | Drop ONE track (YouTube Audio Library) in `projects/<id>/assets/music/` → auto-mixed at 16% with 2s fade-in / 3s fade-out. No file = no music |
| STEP 2 TABLE | Replaced by machine files: `voiceover.txt` + `image-prompts.json` + `project-config.json`. Metadata + thumbnail prompt still output in chat |
| Risk tags 🟢🟡🔴 | Obsolete — everything renders via gpt-image-1, uniform risk |
| FRAME FIRST / FRAME LAST | One image per scene; motion comes from Ken Burns, not interpolation |

Unchanged and binding: PLAN gate (one gate, batched in bulk), audio contract for ElevenLabs,
text overlay contract (max 4, trigger words), thumbnail prompt structure, format mix
40B/30C/20D/10A, metadata rules.

## Scene asset format (`image-prompts.json`) — the director picks the source per scene

```json
[
  { "sceneId": "s01", "prompt": "…" },                                  // ai_image (défaut, inchangé)
  { "sceneId": "s02", "source": "screen_capture",
    "capture": { "url": "https://exemple.com/pricing", "viewport": "1920x1080",
                 "fullPage": false, "selector": ".pricing-table",
                 "hideSelectors": ["#cookie-banner"], "delayMs": 1500 } },
  { "sceneId": "s03", "source": "screen_recording",                     // ← page FILMÉE, curseur + scroll
    "recording": { "url": "https://exemple.com/features", "cursor": true,
                   "beats": [ { "do": "settle", "ms": 600 },
                              { "do": "scrollTo", "selector": "#how-it-works", "ms": 1800 },
                              { "do": "hover", "selector": ".feature-card", "ms": 900 },
                              { "do": "dwell", "ms": 1200 } ] } },
  { "sceneId": "s04", "source": "manual_asset" }                        // ← fichier humain: assets/captures/s04.png ou .mp4
]
```

`screen_recording` = la source qui porte le signal « un humain est derrière » : contrat complet,
verbes de beat, courbes de mouvement et interdits dans **`references/screen-recording-contract.md`**.
`manual_asset` accepte désormais un `.mp4`/`.mov` en plus du `.png` — l'écran connecté filmé à la
main par Théo est le footage le plus convaincant qui existe, et le seul non automatisable.

## TOOL FOOTAGE — quota contraignant (2026-08-01)

> **Pourquoi c'est devenu un quota chiffré.** L'ancienne règle disait « tool footage first, à
> utiliser généreusement ». « Généreusement » n'engage à rien, et la production le montre.
> Mesure sur les 6 plans OFM (`projects/ofm/*/image-prompts.json`, relevé 2026-08-01) :
> **79 % à 97 % des scènes en `ai_image`** — anti-detect 28/30, inro 29/30, onlyspoofer 28/29,
> onlytraffic 29/30, nodemaven 29/32, beacons 23/29. Inrō : **1 seule capture** pour une review
> de CRM entière. OnlyTraffic : **0 capture automatique** (1 `manual_asset`, le site n'étant pas
> capturable). Tout cela respectait formellement le preset.
>
> Une review où on ne voit jamais le produit est lue comme une review écrite par quelqu'un qui
> ne l'a pas utilisé — c'est exactement le retour terrain reçu. Un preset qui n'interdit rien
> ne corrige rien : ce qui suit est un minimum, pas une préférence.
>
> *(À noter : `beacons-shadowban` faisait déjà à 79 % ce que ce preset demande — 4 `manual_asset`
> + 2 `hyperframes`. Ce n'est pas un plancher inatteignable, c'est un plancher déjà approché
> une fois par accident.)*

**S'applique à toute vidéo TOOL-CENTRIC** = qui nomme un produit et prétend en juger (formats
A, B, E, et tout D dont la résolution passe par un outil nommé).

### Les 4 beats obligatoires

Aucun n'est optionnel. Chacun est routé vers du footage RÉEL — `screen_recording` (défaut),
`screen_capture` (si une image fixe suffit) ou `manual_asset` (derrière login).

Ils correspondent un pour un aux blocs de la §SCRIPT STRUCTURE — le format S est construit
autour d'eux, ce ne sont pas des ajouts à caser.

1. **HOMEPAGE — bloc 2, dès la 8ᵉ seconde.** `screen_recording`. Établit que l'outil existe et à
   quoi il ressemble avant toute affirmation à son sujet.
2. **LE PARCOURS CŒUR — bloc 3, en `screen_recording`, jamais en image fixe.** La fonctionnalité
   dont parle la vidéo, en train de fonctionner : on scrolle, on survole, on ouvre. C'est LA
   scène qui prouve qu'un humain a ouvert l'outil, et celle qui fait cliquer.
3. **PRICING — bloc 4.** `screen_capture` de la vraie grille. Les chiffres viennent de la page,
   pas de la mémoire du modèle. C'est la scène la plus proche de l'intention d'achat : elle
   arrive AVANT l'abandon moyen (85 s), pas après.
4. **PREUVE CONTRADICTOIRE — bloc 5.** Une page réelle qui nuance : documentation, CGU,
   changelog, page de statut, comparatif d'un concurrent. C'est ce qui fait lire la vidéo comme
   un avis honnête et pas comme une plaquette affiliée. **Le beat le plus souvent sauté et le
   plus rentable.**

### Le quota — ZÉRO IMAGE IA dans une vidéo tool-centric (durci le 2026-08-01, après visionnage)

> **Pourquoi le quota « ≤ 30 % » n'a pas tenu 24 h.** Premier rendu au nouveau preset
> (`botpenguin-review`) : 3 `ai_image` sur 14 = 21 %, conforme. Retour de Théo après visionnage :
> *« il faut aucune image IA, juste la vidéo du tool, filmé de façon naturelle comme si un humain
> filmait son écran ».* Le défaut n'est pas la proportion, c'est la NATURE du plan. Une seule
> image IA au milieu de captures réelles ne se fond pas : elle signale « généré » et contamine la
> lecture des plans réels qui l'entourent. Un quota qui autorise 4 images IA autorise l'effet
> qu'on essaie de supprimer.

- **`ai_image` = 0 scène dans le corps de la vidéo.** Pas 30 %, pas une. Y compris le hook.
  Seule exception : **la miniature**, qui n'est pas un plan de la vidéo et reste un `ai_image`
  haute qualité sous DA verrouillée.
- **100 % des scènes en footage réel** : `screen_recording` (défaut), `screen_capture` (image
  fixe, uniquement si rien ne bouge dans le plan), `manual_asset` (derrière login).
- **`screen_recording` est le défaut, `screen_capture` l'exception.** Une capture fixe ne
  ressemble pas à quelqu'un qui filme son écran : elle ressemble à une capture d'écran. Un plan
  fixe n'est justifié que si le hover et le scroll n'apportent rien.
- **Les hyperframes ne comblent pas un trou de footage.** Un graphique HTML reste autorisé pour
  une donnée qu'aucune page ne montre (une courbe de coût, une comparaison chiffrée), jamais
  pour illustrer une fonctionnalité que le site montre déjà. En cas de doute : filmer la page.
- Durée par scène filmée : **8-14 s**. **Exception explicite au cap ~7 s** de §VISUAL CADENCE :
  une scène filmée porte son mouvement interne (curseur, scroll, hover), ce n'est pas un plan
  figé.
- **Le hook aussi est du footage.** Le plan métaphorique du hook devient une page réelle qui dit
  la même chose : page « use case », page support, hero de la home. Le hook est porté par la
  VOIX, pas par l'image.

> **Contrôle arithmétique** (format S) : 14 scènes × ~10,2 s = 143 s ✔ · 14 scènes réelles / 14
> = 100 % ✔ · 0 `ai_image` ✔ · ≥ 10 `screen_recording` ✔

### Mouvement : jamais de Ken Burns sur du contenu d'écran

Le Ken Burns (`push-in` / `pan`) recadre dans le pixel : sur une photo générée en 1536×1024 c'est
invisible, sur une page web capturée en 1920×1080 c'est un **agrandissement d'un texte déjà à sa
résolution native**. Résultat mesuré sur le premier rendu : deux passages (0:56-1:03, 1:16)
lus comme *« hyper zoomé super laid »*.

- Toute scène dont l'asset est une capture ou un enregistrement d'écran : **`motion: "static"`**,
  sans exception. Le mouvement vient du curseur et du scroll, il est DANS le clip.
- `push-in` / `pan` ne restent légitimes que sur une image générée — donc, depuis le quota
  ci-dessus, sur la seule miniature. En pratique : **plus aucun Ken Burns dans une vidéo
  tool-centric.**
- Corollaire sur §VISUAL CADENCE (« aucun plan totalement statique ») : la règle est satisfaite
  par le mouvement interne du clip. Un `screen_recording` en `motion: "static"` n'est PAS un plan
  figé.
- `textOverlay` est ignoré par `assemble` sur un clip. Ne pas en écrire un sur une scène filmée :
  il ne s'affichera pas et le WARN au rendu fait croire à une régression.

### Qualité d'encodage — le contenu d'écran est le pire cas de x264

Texte fin, aplats, bordures d'un pixel : ce que `crf 20 + preset veryfast` laisse passer sur une
photo devient visiblement pixelisé sur une page web. Et la chaîne empile **trois générations**
(webm du screencast → mp4 → `conformClip` → mux final), chacune repartant du même crf.

- `lib/ffmpeg.ts` : `VIDEO_CRF = "16"`, `VIDEO_PRESET = "medium"`, appliqués à `kenBurnsClip`,
  `conformClip`, `normalizeClip` et `finalMux`. `lib/recording.ts` encode au même réglage.
- Filmer au **viewport de sortie exact** (`1920x1080`) : aucun rééchantillonnage entre la page et
  le master. Un viewport plus petit upscalé est flou quoi qu'on fasse au crf.
- Ne jamais « rattraper » une source molle au montage. Si un plan est flou, c'est la capture
  qu'on refait.

### Le contrôle au PLAN

Le PLAN liste les 4 beats avec, pour chacun, l'URL et la source retenues. **Un PLAN de vidéo
tool-centric qui n'affiche pas les 4 beats sourcés est invalide : on le réécrit AVANT le gate,
pas après le rendu.** Si un beat ne peut pas être capturé (Cloudflare, login, page inexistante),
il bascule en `manual_asset` et le PLAN le dit — c'est là que l'humain apprend qu'il a un
enregistrement à fournir, jamais après le rendu, et **jamais par un repli silencieux sur
`ai_image`**.

`ai_image` garde son rôle : hook, concept, métaphore, transition, émotion. Le mix reste la règle
(footage + IA + hyperframes + motion, cap ~7 s par plan) pour ne pas endormir, et le packaging
(titre / miniature) reste **problème-first**.

Subtitles: profile `render-config.json` → `subtitles: burned | cc | none` (override par projet
via `project-config.json`). `subs.srt` toujours produit pour les CC YouTube. En `burned` :
segments ≤ 4 mots, une ligne, remontés au-dessus des contrôles, fond semi-transparent,
JAMAIS affichés sur une scène capture/manual_asset ni sur une scène à overlay.
Public URLs only — no login automation, ever. Captures cost $0 and are idempotent
(hash of url+viewport+fullPage+selector+hideSelectors; re-captured only if the spec changes).
