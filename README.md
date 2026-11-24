# CampusConnect — Entraide et partage entre étudiants

Plateforme web complète d'entraide entre étudiants : publication de demandes
d'aide, propositions, séances de révision, évaluations, tableau de bord,
espace administrateur et **Smart Help** (recommandation intelligente).

Projet réalisé dans le cadre de la matière **React & Next.js** (5e année Génie Logiciel).

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | **Next.js 16** (App Router, Server Components, Server Actions) |
| Langage | **TypeScript** strict |
| UI | **Tailwind CSS 4**, composants réutilisables, Lucide React |
| Base de données | **SQLite + Prisma 7** (driver adapter better-sqlite3) |
| Auth | Sessions en base + cookie `httpOnly`, mots de passe hashés **bcrypt** |
| Validation | **Zod + React Hook Form** (même schéma client et serveur) |
| Graphiques | Recharts |
| Tests | **Vitest** (unitaires + intégration règles métier), **Playwright** (E2E) |

## Installation et lancement

```bash
# 1. Installer les dépendances (génère aussi le client Prisma)
npm install

# 2. Configurer l'environnement
cp .env.example .env        # DATABASE_URL="file:./dev.db" déjà prêt

# 3. Créer la base et la remplir avec les données de démonstration
npm run db:migrate          # applique les migrations (première fois : crée la base)
npm run db:seed             # comptes + données de démo

# 4. Lancer l'application
npm run dev                 # http://localhost:3000
```

Autres commandes utiles :

```bash
npm run build       # build de production
npm run start       # servir le build
npm run lint        # ESLint
npm run test        # tests unitaires + intégration (Vitest)
npm run test:e2e    # tests end-to-end (nécessite : npx playwright install chromium)
npm run db:studio   # explorateur de données Prisma Studio
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@campusconnect.tn` | `Admin123!` |
| Étudiante | `yasmine@etudiant.tn` | `Etudiant123!` |
| Étudiant | `ahmed@etudiant.tn` | `Etudiant123!` |
| Étudiante | `fatma@etudiant.tn` | `Etudiant123!` |
| Étudiant | `karim@etudiant.tn` | `Etudiant123!` |
| Étudiante | `sarah@etudiant.tn` | `Etudiant123!` |

## Fonctionnalités

- **Authentification** : inscription, connexion, déconnexion, sessions persistées.
- **Profil étudiant** : spécialité, niveau, compétences, bio, photo (URL), profil public consultable.
- **Demandes d'aide** : CRUD complet, recherche + filtres (matière, niveau, statut), cycle `OPEN → ACCEPTED → COMPLETED`.
- **Propositions** : message de présentation, acceptation/refus par l'auteur seul ; acceptation → autres propositions refusées automatiquement (transaction).
- **Séances** : planification après acceptation, réalisation/annulation, participants uniquement.
- **Évaluations** : note 1-5 + commentaire, uniquement après clôture et entre participants.
- **Tableau de bord** : statistiques réelles, graphiques (barres + camembert), activité récente.
- **Notifications** : créées par les événements métier, compteur non lues dans la navbar.
- **Espace admin** : statistiques globales, gestion des signalements (traiter / rejeter / supprimer la publication).
- **Smart Help** : recommandation des demandes par **score explicable** (compétences, spécialité, niveau, fraîcheur).

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/  register/     # Authentification
│   └── (app)/                # Espace connecté (layout : sidebar + topbar)
│       ├── dashboard/        # Tableau de bord étudiant
│       ├── requests/         # Liste, détail, création, édition
│       ├── my-requests/      # Mes demandes
│       ├── proposals/        # Envoyées + reçues
│       ├── sessions/         # Séances et évaluations
│       ├── profile/          # Mon profil + profil public [id]
│       ├── notifications/    # Centre de notifications
│       ├── smart-help/       # Recommandations
│       └── admin/            # Espace admin (requireAdmin)
├── components/               # UI réutilisables + formulaires RHF
├── lib/
│   ├── auth/session.ts       # cookie httpOnly + table AuthSession
│   ├── validations/          # Schémas Zod partagés client/serveur
│   ├── services/             # Logique métier pure (règles serveur)
│   └── actions/              # Server Actions ("use server")
├── generated/prisma/         # Client Prisma généré
└── proxy.ts                  # Protection des routes (présence cookie)
prisma/
├── schema.prisma             # User, Skill, HelpRequest, HelpProposal,
│                             # StudySession, Review, Notification, Report
├── migrations/               # Migrations SQL
└── seed.ts                   # Comptes et données de démo
tests/
├── unit/                     # Zod, scoring Smart Help, participants
├── integration/              # Règles métier sur base de test SQLite
└── e2e/                      # Playwright : auth, demandes, accès admin
```

## Sécurité et règles métier

Vérifiées **côté serveur** dans `src/lib/services/` (jamais dans React seul) :

- seul l'auteur modifie/supprime/clôture sa demande ;
- seul l'auteur accepte ou refuse les propositions reçues ;
- une demande clôturée ou pourvue ne reçoit plus de propositions ;
- une évaluation exige : participant + séance réalisée + demande clôturée + pas de doublon (contrainte unique en base) ;
- `/admin` et les actions de modération exigent `role = ADMIN` ;
- sessions en base (révocables), cookie `httpOnly + sameSite=lax`, bcrypt (10 tours) ;
- validation Zod côté client (React Hook Form) **et** côté serveur (Server Actions).

## Smart Help — fonctionnement

`src/lib/services/recommendations.ts` calcule un score pour chaque demande ouverte :

- **+50** la matière est une compétence exacte de l'étudiant ;
- **+15** correspondance partielle avec une compétence ;
- **+25** la matière rejoint sa spécialité ;
- **+10/+5** niveau requis inférieur ou égal / identique au sien ;
- **+5** demande publiée depuis moins de 3 jours.

Les propres demandes et celles déjà proposées sont exclues. Chaque carte
affiche le score **et les raisons** (« La matière React fait partie de tes
compétences »). La fonction `scoreRequest` est pure et testée unitairement.

## Tests

```bash
npm run test          # 24 tests : validations, scoring, règles métier (base test.db dédiée)
npm run test:e2e      # 7 scénarios Playwright (installer chromium d'abord)
```

Les tests d'intégration (`tests/integration/business-rules.test.ts`) prouvent
que les accès interdits sont bloqués côté serveur : modification/suppression
par un tiers, acceptation par un non-auteur, proposition sur demande fermée,
évaluation avant clôture ou par un non-participant, double évaluation.

## Choix techniques justifiés

- **Sessions en base plutôt que JWT** : révocation instantanée (déconnexion
  = suppression de ligne), simple à expliquer et à déboguer.
- **Server Actions + services** : une seule fonction métier appelée par
  l'action — testable sans HTTP, règles centralisées.
- **SQLite** : zéro installation serveur, base versionnée par migrations,
  suffisant pour la charge d'un projet d'école ; migration vers Postgres
  = changer le provider et l'adapter.
- **Table `Skill` + pivot `UserSkill`** : requis pour le matching normalisé
  de Smart Help (et évite les chaînes libres dupliquées).
- **`proxy.ts`** : première barrière (cookie présent ?), la vraie vérif
  session+rôle reste côté serveur (`requireUser`/`requireAdmin`).

## DevOps

**Docker** (prérequis : Docker Desktop lancé) :

```bash
# Image seule
docker build -t campusconnect .
docker run -p 3000:3000 -e RUN_SEED=true campusconnect

# Ou avec Compose (volume nommé → la base survit aux rebuilds)
docker compose up --build          # http://localhost:3000
```

- `Dockerfile` multi-étapes : build avec dépendances complètes, image de
  production allégée. `docker-entrypoint.sh` applique les migrations au
  démarrage (`RUN_SEED=true` peuple la démo).
- `docker-compose.yml` : base SQLite dans le volume `db-data`.

**CI — GitHub Actions** (`.github/workflows/ci.yml`) : à chaque push/PR —
`npm ci` → `prisma migrate deploy` → lint → Vitest → `next build` → build de
l'image Docker. Le badge s'affiche dans l'onglet Actions du repo.

### Kubernetes (Minikube)

Manifests bruts dans `k8s/` (numérotés comme les TP). Prérequis :
`minikube start` + `minikube addons enable ingress` + image dans le daemon
Minikube : `minikube image build -t campusconnect .`

```bash
kubectl apply -f k8s/                 # tout le projet
sh k8s/check.sh                       # diagnostic (pods, svc, pv/pvc, ingress)

# Accès — 3 façons :
minikube service campusconnect-nodeport -n campusconnect   # NodePort :30080
echo "$(minikube ip) campusconnect.local" | sudo tee -a /etc/hosts
# puis http://campusconnect.local                          # Ingress
kubectl port-forward svc/campusconnect-clusterip 8080:80 -n campusconnect
```

Points clés : `replicas: 1` (SQLite + ReadWriteOnce = un seul pod),
`storageClassName: ""` sur le PV/PVC pour forcer le binding statique
(le défaut créerait un PV dynamique — piège du TP PV/PVC), sonde
readiness sur `/login` (page publique).

### Helm

Chart propre dans `helm/campusconnect/` (deployment, service, ingress,
PV/PVC, ConfigMap + Secret) :

```bash
helm install cc helm/campusconnect -n campusconnect
helm list -n campusconnect
helm upgrade cc helm/campusconnect -n campusconnect --set image.tag=v2
helm rollback cc 1 -n campusconnect
helm uninstall cc -n campusconnect

# custom-values.yaml possible : -f custom-values.yaml
helm template cc helm/campusconnect   # rendu sans appliquer
```

### Terraform

`terraform/` déploie le projet via le provider `kubernetes` (mêmes
ressources que `k8s/`, en IaC) :

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # adapter kube_context
terraform init && terraform plan
terraform apply          # crée ns, PV/PVC, ConfigMap, Secret, deploy, svc, ingress
terraform destroy
```

### Monitoring

- **Prometheus + Grafana** : `monitoring/prometheus-grafana.md` —
  `kube-prometheus-stack` dans le ns `monitoring` (StatefulSet + DaemonSet),
  port-forward Grafana `:3001` / Prometheus `:9090`, requêtes PromQL.
- **ELK** : `monitoring/elk/` — Elasticsearch + Logstash + Filebeat +
  Kibana en Docker (`cd monitoring/elk && docker compose up -d`),
  logs du conteneur indexés dans `campusconnect-*`, visibles sur :5601.


## Limites connues

- Photo de profil par URL externe (pas d'upload de fichier).
- `better-sqlite3` est un module natif : `npm install` le compile
  (prérequis : outils de build C++ sur Windows si pas de binaire précompilé).
- Pas de pagination sur les listes (acceptable à l'échelle démo).
- Les tests E2E utilisent la base de dev seedée (`npx prisma db seed`).
