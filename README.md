# imDone

Suivi de journée par blocs de durée, version « micro » de Structured. Chaque jour, tu définis des blocs
(ex. 2h LeetCode, 1h20 Muscu…), tu lances un chrono, la barre se remplit et le bloc est validé à 100 %.

Les données sont d'abord dans le `localStorage` du navigateur (l'app marche hors ligne). En option, une
**synchronisation Supabase** les sauvegarde dans le cloud et les partage entre appareils (voir plus bas).

## Fonctionnalités

- Liste des blocs du jour : emoji, couleur, durée cible, temps accompli, barre de progression, état (à faire / en cours / validé).
- Chrono Start / Pause, **un seul actif à la fois** (démarrer un bloc met l'autre en pause).
- Le chrono **survit au rechargement et à la mise en veille** : on stocke des timestamps, jamais un compteur incrémenté.
- Validation automatique à 100 % avec animation, bandeau, et, en option, son et notification navigateur. Le chrono peut continuer en dépassement (`+mm:ss`).
- Ajustement manuel (±5, ±15, +30 min) et validation manuelle d'un bloc.
- Gestion des blocs : créer, éditer, supprimer, réordonner ; **modèle de journée** copié chaque nouveau jour (temps remis à zéro).
- Progression globale de la journée (chaque bloc est plafonné à sa cible).
- Historique des 7 derniers jours (grille bloc × jour, taux par jour) et streak de jours où tous les blocs sont validés.
- Synchronisation optionnelle entre appareils (connexion par lien envoyé par email, sans mot de passe).

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
├─ sync/       Client Supabase, lecture/écriture de l'état distant
├─ state/      Reducer pur + StoreProvider React (persistance, changement de jour)
├─ hooks/      useNow (horloge d'affichage), useAutoValidate, usePrefs, useAuth, useCloudSync
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

## Synchronisation entre appareils (Supabase)

Sans configuration, l'app reste 100 % locale. Pour activer la synchro :

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécuter le contenu de [`supabase/schema.sql`](supabase/schema.sql) : il crée la table `app_state`
   et des règles d'accès (RLS) pour que chaque utilisateur ne voie que sa propre ligne.
3. Dans **Authentication → URL Configuration**, ajouter l'adresse de l'app dans *Redirect URLs*
   (`http://localhost:5173` en dev, l'URL déployée en production), sinon le lien de connexion renvoie vers la mauvaise page.
4. Copier `.env.example` en `.env.local` et renseigner l'URL du projet et la clé **publishable**
   (*Project Settings → API Keys*). Cette clé est faite pour être exposée dans le navigateur ; ne mets jamais la clé
   `secret` / `service_role` dans l'app. `.env.local` est ignoré par git.
5. Relancer `npm run dev`, ouvrir « ☁️ Synchronisation » dans l'onglet Journée et saisir ton email.

**Comment les appareils se mettent d'accord.** À chaque cycle (connexion, retour sur l'onglet, modification, toutes
les minutes), l'app lit l'état distant, le fusionne avec le local, puis écrit le résultat. La fusion se fait **jour par jour :
le jour modifié le plus récemment gagne** (`updatedAt`), et le modèle suit la même règle. Un jour vierge créé sur un nouvel
appareil ne remplace jamais des données existantes. Le chrono étant basé sur des timestamps, un chrono lancé sur un
appareil continue de tourner correctement sur l'autre.

Limite assumée : si tu modifies le *même jour* sur deux appareils hors ligne, le plus récent l'emporte en entier (pas de
fusion bloc par bloc).

L'app est 100 % statique : `npm run build` produit le dossier `dist/`.

### Vercel

1. Importer le dépôt sur [vercel.com/new](https://vercel.com/new).
2. Vercel détecte Vite : `npm run build`, dossier de sortie `dist`.
3. Pour la synchro, ajouter les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (Settings → Environment Variables), puis redéployer.

### Netlify

1. « Add new site » → « Import an existing project », puis choisir le dépôt.
2. Les réglages viennent de `netlify.toml` (`npm run build`, publication de `dist`).
3. Pour la synchro, ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (Site configuration → Environment variables), puis redéployer.

### GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` lance les tests, construit avec le bon sous-chemin et déploie.

1. Pousser le dépôt sur GitHub (branche `main`).
2. Dans « Settings → Pages », choisir **Source : GitHub Actions**.
3. Pour la synchro, créer deux **variables de dépôt** (Settings → Secrets and variables → Actions → *Variables*) :
   `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Avec un **domaine personnalisé** (ex. `imdone.tech`), le site est à la racine : créer aussi la variable de dépôt
   `VITE_BASE` avec la valeur `/`. Sans domaine personnalisé, ne pas la définir (le workflow utilise `/<nom-du-dépôt>/`).
5. Chaque push sur `main` redéploie sur `https://<utilisateur>.github.io/<nom-du-dépôt>/`.

Le sous-chemin est fourni au build par la variable `VITE_BASE` (par défaut `/`). Pour tester le build Pages en local :

```bash
VITE_BASE=/im_done/ npm run build && npm run preview
```

## Limites connues

- Sans synchronisation activée, les données sont propres à chaque navigateur et appareil, et vider les données du site efface l'historique.
- Les variables `VITE_*` sont lues **au build** : après les avoir changées, il faut reconstruire / redéployer.
- Les changements faits sur un appareil n'apparaissent sur l'autre qu'au prochain cycle de synchro (retour sur l'onglet ou au plus une minute).
