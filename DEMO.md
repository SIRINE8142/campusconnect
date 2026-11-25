# Guide de démo DevOps — CampusConnect

Démo en 4 actes : Docker → Kubernetes → Helm → Terraform.
Pour chaque commande : ce qui se passe techniquement + ce qu'on dit.

---

## 🎬 PRÉPARATION

```powershell
minikube start --driver=docker
```

**Ce qui se passe** : minikube crée un cluster Kubernetes **local à 1 nœud**, dans un conteneur Docker. C'est le "mini-datacenter" pour la démo.

💬 *"Minikube simule un vrai cluster Kubernetes sur ma machine — en entreprise ce serait des dizaines de serveurs, ici c'est un seul nœud Docker."*

```powershell
minikube addons enable ingress
```

**Ce qui se passe** : installe **nginx-ingress-controller** dans le cluster — le "répartiteur de trafic" qui lit les règles Ingress.

💬 *"L'Ingress ne marche pas tout seul : il faut un contrôleur qui interprète les règles. C'est l'équivalent d'un reverse proxy nginx géré par Kubernetes."*

```powershell
docker build -t campusconnect .
minikube image load campusconnect:latest
```

**Ce qui se passe** : `docker build` lit le Dockerfile et crée l'image **localement**. `image load` la **copie dans minikube** — car minikube a son propre Docker interne, il ne voit pas les images de Docker Desktop.

💬 *"Le pod Kubernetes doit trouver l'image. Comme minikube a son propre moteur de conteneurs, je lui transfère mon image locale — sinon il chercherait sur Docker Hub et échouerait."*

---

## 📦 ACTE 1 — Docker

```powershell
docker run -d --name cc -p 4000:3000 -e RUN_SEED=true campusconnect
```

**Ce qui se passe** :

- `-d` → conteneur en arrière-plan (detached)
- `-p 4000:3000` → le port 4000 de Windows redirige vers le port 3000 **dans** le conteneur
- `-e RUN_SEED=true` → variable d'environnement : dit à l'entrypoint de peupler la base

💬 *"Le conteneur est isolé : il a son propre système de fichiers, ses variables, son réseau. Le mapping de port crée un tunnel entre Windows et l'intérieur du conteneur."*

```powershell
docker logs cc
```

**Ce qui se passe** : montre la sortie de `docker-entrypoint.sh` :

1. `prisma migrate deploy` → crée les tables
2. `prisma db seed` → données de démo (parce que RUN_SEED=true)
3. `npm start` → Next.js démarre

💬 *"L'entrypoint est un script qui s'exécute AVANT l'app : il prépare la base à chaque démarrage. C'est le pattern 'init au boot' — le conteneur est autonome, on ne configure rien à la main."*

→ **http://localhost:4000** — login `admin@campusconnect.tn` / `Admin123!`

```powershell
docker rm -f cc
```

💬 *"Je supprime le conteneur — et avec lui tout son contenu : c'est pour ça que les données doivent vivre dans un VOLUME externe (on le verra avec PV/PVC)."*

---

## ☸️ ACTE 2 — Kubernetes (manifests bruts)

```powershell
kubectl apply -f k8s/
```

**Ce qui se passe** : kubectl envoie les 9 fichiers YAML à l'API Kubernetes. Le cluster **compare l'état désiré (le YAML) à l'état réel** et crée ce qui manque. C'est le principe **déclaratif** : tu dis "je veux ça", K8s se débrouille.

💬 *"Contrairement à docker run qui est impératif, Kubernetes est déclaratif : je décris l'état final dans des fichiers YAML, le cluster converge vers cet état — et y revient automatiquement si quelque chose casse."*

```powershell
kubectl get all -n campusconnect
```

**Ce qui se passe** : liste les ressources du namespace. On voit la **chaîne complète** :

```
Deployment → ReplicaSet → Pod   (qui exécute le conteneur)
Service ClusterIP + NodePort    (qui exposent le pod)
```

💬 *"Le Deployment gère les replicas et les mises à jour ; le ReplicaSet garantit qu'il y a toujours 1 pod vivant — si je le supprime, il est recréé automatiquement ; le Pod enveloppe mon conteneur."*

```powershell
kubectl get pvc -n campusconnect
```

**Ce qui se passe** : `Bound` = le PVC a trouvé son PV.

💬 *"Le PVC dit 'je veux 500Mo', le PV les fournit via hostPath. J'ai ajouté `claimRef` dans le PV pour qu'il se réserve à MON pvc — sinon le provisioner de minikube créait un PV dynamique et le mien restait inutilisé. C'est un piège classique vu dans le TP."*

**Le pod — ce qui se passe dedans** :

```
Pod démarre → monte le PVC sur /app/data → entrypoint : migrate + seed
→ Next.js écoute :3000 → readinessProbe teste GET /login toutes les 5s
→ succès → pod "Ready" → le Service peut lui envoyer du trafic
```

💬 *"La readinessProbe est critique : sans elle, le Service enverrait des requêtes pendant que l'app démarre encore → erreurs 503. Le probe dit 'n'envoie du trafic que quand /login répond 200'."*

```powershell
kubectl port-forward -n campusconnect svc/campusconnect-clusterip 4000:80
```

**Ce qui se passe** : tunnel local vers le Service. `svc/campusconnect-clusterip` **port 80** → pod **port 3000**.

💬 *"Sous Windows l'IP interne de minikube n'est pas routable depuis le navigateur. port-forward est l'outil de debug officiel. Le ClusterIP est normalement interne au cluster — c'est volontaire : l'accès externe se fait via NodePort ou Ingress."*

→ **http://localhost:4000** puis Ctrl+C pour arrêter le tunnel.

```powershell
kubectl delete -f k8s/
```

💬 *"delete -f supprime exactement ce que le dossier avait créé — la symétrie apply/delete rend la gestion propre."*

---

## ⛵ ACTE 3 — Helm

```powershell
helm template cc ./helm/campusconnect
```

**Ce qui se passe** : Helm **génère** le YAML final en injectant `values.yaml` dans les `templates/` — **sans rien déployer**. On voit `{{ .Values.app.name }}` devenir `campusconnect`.

💬 *"C'est du templating : les manifests ne sont plus écrits en dur. Le même chart produit des configs différentes selon l'environnement — dev, staging, prod — en changeant juste values.yaml."*

```powershell
helm install cc ./helm/campusconnect -n campusconnect --create-namespace
kubectl get pods -n campusconnect
helm list -n campusconnect
```

**Ce qui se passe** : Helm rend les templates → envoie à l'API K8s → **enregistre la release** `cc` révision 1 dans son historique (stocké dans des Secrets du cluster).

💬 *"install = template + apply + mémoire. Helm crée une 'release' nommée — il sait que ces ressources appartiennent à la release 'cc' révision 1. C'est ce qui rend possible l'upgrade et le rollback."*

```powershell
helm upgrade cc ./helm/campusconnect -n campusconnect --set app.nodeEnv=staging
helm history cc -n campusconnect
```

**Ce qui se passe** : `--set` écrase une value → Helm re-rend les templates → applique **seulement le diff** → révision 2.

💬 *"upgrade est un déploiement incrémental : Helm compare la nouvelle version rendue avec l'ancienne et ne modifie que ce qui a changé. L'historique garde la révision 1 intacte."*

```powershell
helm rollback cc 1 -n campusconnect
helm history cc -n campusconnect
```

**Ce qui se passe** : retour à l'état de la révision 1 → nouvelle révision 3 ("Rollback to 1").

💬 *"En prod, si une mise à jour casse, `helm rollback` restaure la version stable en secondes — sans retrouver les anciens YAML à la main. C'est le filet de sécurité du déploiement."*

→ App via Helm : `kubectl port-forward -n campusconnect svc/cc-campusconnect 4000:80`
(⚠️ le service Helm s'appelle `cc-campusconnect`, pas `campusconnect-clusterip`)

```powershell
helm uninstall cc -n campusconnect
kubectl delete ns campusconnect
```

💬 *"uninstall supprime toutes les ressources de la release en une commande. Le namespace reste — Helm ne supprime pas ce qu'on lui a demandé de créer avec --create-namespace à l'extérieur du chart."*

---

## 🏗️ ACTE 4 — Terraform

```powershell
cd terraform
terraform init
```

**Ce qui se passe** : lit `main.tf`, voit `provider "kubernetes"`, télécharge le plugin provider dans `.terraform/` — l'adaptateur qui traduit HCL → appels API Kubernetes.

💬 *"init = installation des plugins. Terraform est multi-cloud : le même outil pilote Kubernetes, AWS, Azure, Docker... il suffit de changer de provider."*

```powershell
terraform plan
```

**Ce qui se passe** : Terraform compare **3 états** : le code (désiré) + le tfstate (sa mémoire) + le cluster réel → affiche le diff **avant** d'agir. `Plan: 9 to add`.

💬 *"plan = dry-run : je vois exactement ce qui va être créé, modifié ou détruit avant d'appuyer sur la gâchette. En entreprise le plan passe en revue de code — personne ne fait apply à l'aveugle."*

```powershell
terraform apply
```

**Ce qui se passe** : crée les 9 ressources **dans le bon ordre** (namespace avant pvc, pvc avant deployment — Terraform calcule le graphe de dépendances) → écrit `terraform.tfstate`.

💬 *"Le tfstate est la mémoire de Terraform : il sait que CES 9 objets précis sont les siens. C'est ce qui lui permet — contrairement à kubectl — de détecter si quelqu'un modifie le cluster à la main (drift)."*

```powershell
terraform output
kubectl get pods -n campusconnect
```

💬 *"Les outputs sont les 'valeurs de retour' du déploiement — URLs, noms de services — réutilisables par d'autres configs ou pour la doc."*

```powershell
terraform destroy
cd ..
```

**Ce qui se passe** : supprime les 9 ressources **dans l'ordre inverse** (pod avant pvc, pvc avant namespace).

💬 *"destroy = nettoyage total garanti par le state : rien n'est oublié, rien d'orphelin. Avec kubectl il faut se souvenir de ce qu'on a créé ; avec Terraform, destroy suffit."*

---

## ⚠️ Les pièges connus (vécus en préparant)

| Si le prof voit/demande | Réponse |
|---|---|
| Pourquoi `port-forward` et pas `minikube ip` ? | *"Sous Windows le driver Docker de minikube n'expose pas son IP à l'hôte — port-forward ou `minikube tunnel` sont les solutions officielles"* |
| Erreur "namespace already exists" avec Terraform | *"Terraform veut posséder ce qu'il gère — le namespace doit être créé par lui ou importé dans le state"* |
| Pourquoi `replicas: 1` ? | *"SQLite = 1 fichier + PVC ReadWriteOnce : impossible de partager entre plusieurs pods. Avec Postgres je passerais à 3"* |
| Pourquoi python3/g++ dans le Dockerfile ? | *"better-sqlite3 est un module natif C++ — npm le compile via node-gyp qui exige Python + compilateur. Ils ne sont que dans l'étape build, pas dans l'image finale"* |
| ClusterIP vs NodePort vs Ingress ? | *"ClusterIP = interne au cluster ; NodePort = port fixe exposé sur le nœud (30080) ; Ingress = routage HTTP par nom de domaine"* |
| Helm vs Terraform ? | *"Helm déploie des apps dans un cluster existant (templating + releases) ; Terraform gère l'infra elle-même avec un état versionné — et peut créer le cluster"* |

---

## 🎯 Une phrase par acte

| Acte | La phrase clé |
|---|---|
| Docker | *"L'app + ses dépendances = une image portable qui tourne pareil partout"* |
| Kubernetes | *"Déclaratif : je décris l'état final, le cluster converge et s'auto-répare"* |
| Helm | *"Les manifests deviennent des templates paramétrables + historique avec rollback"* |
| Terraform | *"L'infrastructure devient du code : plan avant action, état versionné, destroy propre"* |
