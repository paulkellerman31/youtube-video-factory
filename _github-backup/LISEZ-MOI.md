# Sauvegarde automatique du projet sur GitHub

Ce petit outil sauvegarde ton projet sur **GitHub** (un cloud gratuit pour le code).
À chaque modification, une copie est envoyée automatiquement : c'est ta sauvegarde et ton historique.

Tes secrets (`.env`, clés API, voix ElevenLabs) et tes vidéos (`projects/`) ne sont **jamais** envoyés : ils sont exclus par le fichier `.gitignore`.

---

## Ce qu'il te faut (une seule fois)

1. **Un compte GitHub** (gratuit) : https://github.com/signup
2. **Git installé** sur ton PC : https://git-scm.com/download/win
   (installe-le en cliquant « Suivant » partout, les choix par défaut conviennent)

---

## Installation en 3 étapes

### 1) Configurer (une seule fois)
Double-clique sur **`Configurer-GitHub.bat`**.
On te demandera :
- ton nom d'utilisateur GitHub,
- un **token** (mot de passe spécial). Le script t'explique comment l'obtenir en 4 clics, ou directement ici :
  - Ouvre https://github.com/settings/tokens/new
  - « Note » : `sauvegarde-projet` — « Expiration » : `No expiration`
  - Coche la case **`repo`**
  - Clique **Generate token**, copie le code (`ghp_...`) et colle-le dans la fenêtre.

Le script crée un dépôt **privé** et envoie ton projet. 

### 2) Activer la sauvegarde automatique
Double-clique sur **`Demarrer-Sauvegarde-Auto.bat`**.
Une fenêtre s'ouvre et reste ouverte : tant qu'elle est là, chaque modification est sauvegardée (sous ~10 secondes). Tu peux la réduire.

### 3) (Recommandé) Démarrage automatique
Double-clique sur **`Lancer-au-demarrage-de-Windows.bat`**.
La sauvegarde se relancera toute seule à chaque démarrage de Windows. Tu n'auras plus rien à faire.

---

## Questions fréquentes

**Où est mon projet sauvegardé ?**
Sur `https://github.com/TON-NOM/youtube-video-factory` (privé, visible seulement par toi).

**Et si je travaille hors connexion ?**
Pas de souci : les modifications s'enverront automatiquement dès le retour d'internet.

**Comment arrêter la sauvegarde ?**
Ferme la fenêtre « Sauvegarde automatique ». Pour la retirer du démarrage, supprime le raccourci `Sauvegarde-GitHub.lnk` dans le dossier Démarrage de Windows.

**Mes clés API sont-elles en sécurité ?**
Oui. Le fichier `.env` n'est jamais envoyé. Le token GitHub est stocké uniquement sur ton PC (dans `.git`, jamais sur le cloud).
