# MCP YouTube — mémo d'installation et d'utilisation

Dernière mise à jour : 29 juillet 2026

Ce dossier documente les serveurs MCP YouTube installés sur ce PC et contient les
scripts pour les réparer/réinstaller si besoin. **Ne pas déplacer les dossiers MCP à la
main** (leurs chemins sont inscrits dans la config de Claude — voir plus bas).

---

## Ce qui est installé

Deux serveurs, rangés dans `C:\Users\nares\Documents\MCP\` :

### 1. youtube-studio-mcp — ACTIF (celui qui sert)
- Emplacement : `C:\Users\nares\Documents\MCP\youtube-studio-mcp`
- Type : serveur Python, authentification **OAuth** (gère TA chaîne).
- Source : https://github.com/i1s-abhishek/youtube-studio-mcp

**Ce qu'il permet :**
- Aperçu de la chaîne (abonnés, vues…).
- Lister/inspecter tes vidéos (y compris non répertoriées / privées / brouillons).
- **Éditer les métadonnées** : titre, description, tags, catégorie, langue, confidentialité
  (édition en masse possible en bouclant sur les vidéos).
- Changer les miniatures (upload d'image depuis le PC).
- Analytics chaîne + par vidéo (watch time, vues, rétention…).
- Lire et poster des commentaires.

**Ce qu'il NE permet PAS :**
- Analyser d'autres chaînes / le YouTube public (limité à ta chaîne connectée).
- Uploader de **nouvelles vidéos** (pas de videos.insert).
- Supprimer des vidéos.

### 2. youtube-mcp-server — INACTIF (pas enregistré)
- Emplacement : `C:\Users\nares\Documents\MCP\youtube-mcp-server`
- Type : serveur Node, **clé API** (lecture seule, données publiques).
- Source : https://github.com/Nocodeboy/youtube-mcp-server
- Sert à **rechercher** des vidéos/chaînes publiques (veille concurrentielle).
  Ne modifie rien. À activer seulement si besoin (requiert une clé API YouTube Data v3).

---

## Où et comment l'utiliser

- Les MCP **locaux** fonctionnent dans une **conversation Claude Desktop classique**
  (pas forcément dans un espace Cowork/projet).
- Dans une nouvelle conversation, cliquer sur l'**icône des outils** de la barre de saisie
  et **activer `youtube-studio`** pour cette conversation.
- Vérifier le statut : Paramètres → Développeur → Serveurs MCP locaux → `youtube-studio`
  doit être **« running »**.

Exemples de demandes :
- « Donne-moi un aperçu de ma chaîne et résume mes 10 dernières vidéos. »
- « Audite les descriptions de mes 20 dernières vidéos et réécris-les selon ce modèle : … »
- « Analyse mes 28 derniers jours d'analytics et dis-moi quoi améliorer. »

---

## Config Claude Desktop

Fichier : `%APPDATA%\Claude\claude_desktop_config.json`
Entrée active `mcpServers.youtube-studio` :
- command : `C:\Users\nares\AppData\Local\Programs\Python\Python311\python.exe`
- args : `...\Documents\MCP\youtube-studio-mcp\scripts\server.py`
- cwd : `...\Documents\MCP\youtube-studio-mcp`
- env : `YOUTUBE_CLIENT_SECRETS` + `YOUTUBE_TOKEN_FILE` (dans `secrets\`)

---

## Maintenance / dépannage

- **Ne jamais déplacer les dossiers à la main.** Pour ranger/déplacer, utiliser un script
  qui met aussi à jour la config (voir `reparer_mcp.ps1`).
- **Le connecteur n'apparaît plus / erreur** → double-cliquer sur `Reparer_MCP.bat`
  (Claude Desktop fermé au préalable). Il relocalise le dossier et réécrit une config correcte.
- **Reconnexion Google nécessaire (token expiré)** → dans un terminal, depuis le dossier :
  `cd C:\Users\nares\Documents\MCP\youtube-studio-mcp` puis `python scripts\auth.py auth`.
- **Éviter l'expiration du token tous les 7 jours** → dans Google Cloud, écran de
  consentement OAuth → **« Publier l'application »** (statut « En production »).

---

## Fichiers de ce dossier

- `Reparer_MCP.bat` + `reparer_mcp.ps1` — répare/range le MCP et réécrit la config.
- `install_youtube_studio_mcp.ps1` — installateur complet (en cas de réinstallation).

---

## À faire plus tard (idées notées pendant l'installation)

- **Multi-chaînes sur le même Claude** : modifier le serveur pour gérer plusieurs
  « profils » (un `token.json` par compte) + un paramètre pour choisir la chaîne.
- **Veille publique** : activer `youtube-mcp-server` (clé API YouTube Data v3 à créer).
- **Upload de vidéos** : nécessiterait un serveur différent/étendu (videos.insert).
