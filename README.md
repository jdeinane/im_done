# imDone

Suivi de journée par blocs de durée, version « micro » de Structured. Chaque jour, tu définis des blocs
(ex. 2h LeetCode, 1h20 Muscu…), tu lances un chrono, la barre se remplit et le bloc est validé à 100 %.

Tout tourne dans le navigateur : pas de backend, les données sont dans le `localStorage`.

## Fonctionnalités

- Liste des blocs du jour : emoji, couleur, durée cible, temps accompli, barre de progression, état (à faire / en cours / validé).
- Chrono Start / Pause, **un seul actif à la fois** (démarrer un bloc met l'autre en pause).
- Le chrono **survit au rechargement et à la mise en veille** : on stocke des timestamps, jamais un compteur incrémenté.
- Validation automatique à 100 % avec animation, bandeau, et, en option, son et notification navigateur. Le chrono peut continuer en dépassement (`+mm:ss`).
- Ajustement manuel (±5, ±15, +30 min) et validation manuelle d'un bloc.
- Gestion des blocs : créer, éditer, supprimer, réordonner ; **modèle de journée** copié chaque nouveau jour (temps remis à zéro).
- Progression globale de la journée (chaque bloc est plafonné à sa cible).
- Historique des 7 derniers jours (grille bloc × jour, taux par jour) et streak de jours où tous les blocs sont validés.

## Installation et lancement

Prérequis : Node.js `^20.19` ou `>=22.12`.

```bash
npm install
npm run dev
```

L'app est servie sur http://localhost:5173.

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests unitaires (Vitest), une passe |
| `npm run test:watch` | Tests en continu |
| `npm run lint` | Lint (oxlint) |
| `npm run build` | Vérification TypeScript + build de production dans `dist/` |
| `npm run preview` | Sert le build de production en local |

## Architecture

```
src/
├─ domain/     Logique pure, sans React, entièrement testée
│              timer, progress, sessions, dayRollover, history, validation, template
├─ storage/    Lecture/écriture versionnée du localStorage (+ préférences)
├─ state/      Reducer pur + StoreProvider React (persistance, changement de jour)
├─ hooks/      useNow (horloge d'affichage), useAutoValidate, usePrefs
├─ components/ BlockCard, ManageBlocks, History, …
└─ lib/        format, notifications, son, ids
```

Points de conception :

- **Temps = fonction des timestamps.** `elapsed = accumulatedMs + manualAdjustMs + (now - runningSince)`.
  Le `setInterval` de `useNow` ne sert qu'à redessiner l'écran ; il n'est jamais la source de vérité.
- **Reducer pur.** Toutes les actions portent `now`, ce qui rend le comportement déterministe et testable.
- **Changement de jour.** Au chargement, au retour sur l'onglet et à minuit, le chrono resté actif sur un jour passé est figé
  à minuit et le nouveau jour est créé depuis le modèle. Chaque jour garde son propre instantané de blocs : modifier le modèle
  ne réécrit jamais l'historique.
- **Persistance versionnée.** L'état est validé au chargement (`schemaVersion: 1`) ; un contenu illisible ou d'une version
  inconnue est ignoré plutôt que de faire planter l'app.
- Le son et les notifications sont **désactivés par défaut** (réglages dans l'onglet « Journée »). Une notification n'est
  envoyée que si l'onglet est ouvert : sans backend, aucune alerte n'arrive onglet fermé.

## Déploiement

L'app est 100 % statique : `npm run build` produit le dossier `dist/`.

### Vercel

1. Importer le dépôt sur [vercel.com/new](https://vercel.com/new).
2. Vercel détecte Vite : `npm run build`, dossier de sortie `dist`. Rien d'autre à configurer.

### Netlify

1. « Add new site » → « Import an existing project », puis choisir le dépôt.
2. Les réglages viennent de `netlify.toml` (`npm run build`, publication de `dist`).

### GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` lance les tests, construit avec le bon sous-chemin et déploie.

1. Pousser le dépôt sur GitHub (branche `main`).
2. Dans « Settings → Pages », choisir **Source : GitHub Actions**.
3. Chaque push sur `main` redéploie sur `https://<utilisateur>.github.io/<nom-du-dépôt>/`.

Le sous-chemin est fourni au build par la variable `VITE_BASE` (par défaut `/`). Pour tester le build Pages en local :

```bash
VITE_BASE=/im_done/ npm run build && npm run preview
```

## Limites connues

- Les données sont propres à chaque navigateur et appareil (pas de synchronisation).
- Vider les données du site efface l'historique.
