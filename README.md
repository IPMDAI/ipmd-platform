# IPMD — Plateforme officielle

Site public de **IPMD — Institut Polytechnique des Métiers du Digital**.
École supérieure digitale, moderne et orientée intelligence artificielle.

> **Ose. Agis. Impacte.** — À IPMD, c'est **80 % de pratique**.

---

## 🧱 Stack technique

- **[Next.js 15](https://nextjs.org/)** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Supabase** (Auth, base de données, stockage, rôles) — _optionnel au démarrage_
- Déploiement **Vercel**

L'architecture est prête pour le web, le mobile et de futurs agents IA
(tuteurs IA par profil), ainsi que pour les sous-domaines à venir
(`campus`, `app`, `admin`, `api`, etc.).

---

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. (Optionnel) Configurer Supabase
cp .env.local.example .env.local
#   puis renseigner vos clés (voir section Supabase)

# 3. Lancer le serveur de développement
npm run dev
```

Le site est alors disponible sur **http://localhost:3000**.

> 💡 **Sans clés Supabase**, le site fonctionne en **mode démo** : les
> formulaires valident les données et confirment l'envoi sans rien persister.
> Aucune configuration n'est nécessaire pour découvrir le site.

### Scripts disponibles

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Serveur de développement             |
| `npm run build`     | Build de production                  |
| `npm run start`     | Lance le build de production         |
| `npm run lint`      | Analyse ESLint                       |
| `npm run typecheck` | Vérification TypeScript (sans build) |

---

## 🗂️ Structure du projet

```
src/
├── app/                      # Pages (App Router)
│   ├── layout.tsx            # Layout racine (Header + Footer)
│   ├── page.tsx              # Accueil
│   ├── formations/           # Catalogue
│   ├── campus/ ultrajobs/ …  # Les 6 univers
│   ├── admission/            # Formulaire d'inscription
│   ├── a-propos/  contact/   # Institut & contact
│   └── not-found.tsx         # Page 404
├── components/
│   ├── layout/               # Header, Footer
│   ├── ui/                   # Composants réutilisables (Button, Card…)
│   ├── cards/                # Cartes (univers, programme, bootcamp)
│   ├── home/                 # Sections de la page d'accueil
│   ├── sections/             # Blocs réutilisables (PageHero, CTA…)
│   └── forms/                # Formulaires (Inscription, Contact)
├── data/                     # Données typées (univers, programmes, bootcamps)
├── lib/
│   ├── actions.ts            # Server Actions des formulaires
│   └── supabase/             # Clients Supabase (client/serveur)
└── types/                    # Types de domaine TypeScript
supabase/
└── schema.sql                # Schéma SQL initial (tables, RLS, rôles)
```

### Les 6 univers IPMD

| Univers               | Type        | Sous-domaine futur        |
| --------------------- | ----------- | ------------------------- |
| IPMD Campus           | Diplômes    | `campus.ipmd.pro`         |
| UltraJobs             | Certificats | `ultrajobs.ipmd.pro`      |
| IPMD Professionnel    | Diplômes    | `pro.ipmd.pro`            |
| UltraBoost            | Certificats | `ultraboost.ipmd.pro`     |
| IPMD Gouvernance      | Diplômes    | `executive.ipmd.pro`      |
| UltraExecutive        | Certificats | `ultraexecutive.ipmd.pro` |

Pour **ajouter un univers**, ajoutez une entrée dans
[`src/data/universes.ts`](src/data/universes.ts) (et l'ID dans le type
`UniverseId` de [`src/types/index.ts`](src/types/index.ts)).

---

## 🔌 Configuration Supabase

1. Créez un projet sur **[supabase.com](https://supabase.com)**.
2. Dans **Settings → API**, copiez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` _(serveur uniquement)_
3. Collez ces valeurs dans `.env.local`.
4. Dans **SQL Editor**, exécutez le contenu de
   [`supabase/schema.sql`](supabase/schema.sql) pour créer les tables
   (`inscription_requests`, `contact_messages`, `profiles`), les rôles et les
   politiques RLS.

Dès que les clés sont présentes, les formulaires écrivent automatiquement
dans Supabase (voir [`src/lib/actions.ts`](src/lib/actions.ts)).

### Rôles prévus

`super_admin` (Recteur / DSI), `admin` (Scolarité, RH, Finance),
`enseignant`, `etudiant`, `parent`, `professionnel`, `dirigeant`.

Ces rôles servent aux futures politiques d'accès (RLS) et au routage des
dashboards (étudiant, parent, enseignant, admin…).

---

## ☁️ Déploiement sur Vercel

1. Poussez le projet sur GitHub.
2. Sur **[vercel.com](https://vercel.com)**, importez le dépôt
   (Vercel détecte Next.js automatiquement).
3. Ajoutez les **variables d'environnement** (mêmes clés que `.env.local`)
   dans **Settings → Environment Variables**.
4. Déployez. Branchez ensuite le domaine **`www.ipmd.pro`**.

---

## 🎨 Identité visuelle

- **Couleurs** : noir `#0b0b0d`, rouge IPMD `#e01228`, blanc / gris clair.
- Les tokens de marque sont définis dans
  [`src/app/globals.css`](src/app/globals.css) (`@theme`) et utilisables
  comme classes Tailwind : `bg-ipmd-red`, `text-ipmd-black`, `bg-ipmd-light`…
- Style premium, digital, futuriste et universitaire, responsive
  mobile / tablette / desktop, avec animations légères au défilement.

---

## 🎓 Bourse IPMD

Système d'aides financières attaché à la scolarité (univers Campus / diplômants).
Une bourse **réduit la scolarité** ; les **frais d'inscription (300 000 FCFA)**
restent toujours dus et ne sont jamais remisés.

### Principes

- **Mode** : **taux** (%) _ou_ **montant** fixe (borné au tarif officiel).
- **Types** : mérite, sociale, partenaire, institutionnelle, autre.
- **Pluriannuel** : 1 / 2 / 3 ans. Le taux est **fixé par année académique** et
  **recalculé chaque année sur le tarif officiel de l'année** (jamais figé à
  l'avance). Historique **non destructif** (l'ancien terme passe `superseded`).
- **Cumul avec la remise du plan de paiement** (`plan_discount_cumulable`) :
  - `false` (défaut) → **meilleur avantage** : le net le plus bas entre
    « bourse seule » et « remise du plan seule » (la bourse ne rend jamais le
    candidat moins avantagé).
  - `true` → bourse d'abord, puis remise du plan sur le **reste**.
- **Bourse totale** (net = 0) → **aucune tranche de scolarité**, mais inscription
  toujours due.
- **Non-rétroactivité** : un échéancier déjà figé (étudiant inscrit) n'est jamais
  recalculé ; un changement de taux / suspension / révocation ne vaut que pour un
  rebuild autorisé ou une **année future / réinscription**.

### Cycle de vie

1. **Attribution** dès le statut `accepté` — rattachée à la **candidature**
   (`scholarships.candidature_id`).
2. À la **finalisation de l'inscription**, la bourse est **re-rattachée à
   l'étudiant** (`student_id` renseigné, `candidature_id = NULL`, `status =
   active`), dans la même transaction que la matérialisation de la finance.
3. Unicité : **1 bourse active par candidature**, puis **par étudiant**.

### Sécurité & confidentialité

- Écriture réservée au **super_admin** : `requireSuperAdmin()` côté action **+**
  RPC `SECURITY DEFINER` (`search_path=''`, `EXECUTE` limité à `service_role`).
- **Aucune lecture publique** des tables `scholarships` / `scholarship_terms`
  (RLS super_admin only ; lecture serveur en service-role).
- Le **motif (`reason`) est strictement privé** : jamais dans le snapshot
  `schedule_json` ni sur aucune surface candidat/étudiant.

### Modèle de données

| Table                        | Rôle                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| `scholarships`               | **Engagement** : candidature/étudiant, type, cumul, année de début, durée, statut (`active`/`revoked`), motif privé |
| `scholarship_terms`          | **Valeur par année** : mode (taux/montant), taux/montant, statut (`active`/`suspended`/`superseded`) |
| `student_finance`            | `scholarship_amount` + `scholarship_term_id` (valeurs **figées** à l'inscription) |

RPC atomiques (write-side) : `grant_scholarship`, `set_scholarship_term`,
`suspend_scholarship_term`, `resume_scholarship_term`, `revoke_scholarship`.

### Fichiers clés

- **Moteur (pur)** — [`src/lib/admission-schedule.ts`](src/lib/admission-schedule.ts) :
  `resolveScholarshipForYear`, `scholarshipAmount`, `applyBourseAndPlan`,
  `buildScheduleSnapshot` (net unifié `round((officiel − bourse) × (1 − remise))`).
- **Lecture** — [`src/lib/scholarship-data.ts`](src/lib/scholarship-data.ts)
  (service-role ; charge par `candidature_id` **ou** `student_id`).
- **Actions admin** — [`src/lib/scholarship-actions.ts`](src/lib/scholarship-actions.ts).
- **Calcul finance** — [`src/lib/finance.ts`](src/lib/finance.ts) (`computeFinance`).
- **UI admin** — [`src/components/espace/ScholarshipPanel.tsx`](src/components/espace/ScholarshipPanel.tsx)
  (attribution + confirmation financière + gestion par année, sur la fiche candidature).
- **Affichage candidat / étudiant** (motif jamais exposé) —
  [`PaymentOptionStep.tsx`](src/components/admission/PaymentOptionStep.tsx) (pack),
  [`EcheancierPdf.tsx`](src/components/espace/documents/EcheancierPdf.tsx) (PDF),
  [`mes-paiements`](src/app/espace/mes-paiements/page.tsx),
  [`proforma`](src/app/espace/proforma/[studentId]/page.tsx).

---

## 🗺️ Prochaines étapes (roadmap)

- [ ] Authentification Supabase + espaces connectés (`app.ipmd.pro`)
- [ ] Dashboards par rôle (étudiant, parent, enseignant, admin)
- [ ] Back-office d'administration (`admin.ipmd.pro`)
- [ ] API publique (`api.ipmd.pro`)
- [ ] Tuteurs IA par profil (IA éducative)
- [ ] Pages de détail par formation / bootcamp

---

© 2026 IPMD — Institut Polytechnique des Métiers du Digital.
