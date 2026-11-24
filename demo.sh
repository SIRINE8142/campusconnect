#!/bin/sh
# ============================================================
#  demo.sh — Démo DevOps CampusConnect (à lancer dans Git Bash)
#  Usage : sh demo.sh           → démo complète avec pauses
#          sh demo.sh 1|2|3|4   → un seul acte
#  Prérequis : Docker Desktop démarré, minikube, kubectl, helm, terraform
# ============================================================

pause() {
  echo ""
  printf ">>> Entrée pour continuer (Ctrl+C pour arrêter)..."
  read -r _
}

title() {
  echo ""
  echo "============================================================"
  echo "  $1"
  echo "============================================================"
}

check() {
  command -v "$1" >/dev/null 2>&1 || { echo "❌ $1 n'est pas installé — étape sautée"; return 1; }
  return 0
}

# ------------------------------------------------------------
acte1() {
  title "ACTE 1 — Docker : image + conteneur"
  check docker || return

  echo "→ Construction de l'image multi-étapes…"
  docker build -t campusconnect . || return
  pause

  echo "→ Lancement du conteneur (migrations + seed automatiques)…"
  docker rm -f cc-demo 2>/dev/null
  docker run -d --name cc-demo -p 4000:3000 -e RUN_SEED=true \
    -v cc-demo-data:/app/data campusconnect
  sleep 12
  docker logs cc-demo | tail -8
  echo ""
  echo "🌐 Ouvrir http://localhost:4000  (admin@campusconnect.tn / Admin123!)"
  pause

  echo "→ Nettoyage du conteneur de démo…"
  docker rm -f cc-demo
  echo "✅ Acte 1 terminé (volume cc-demo-data conservé → données persistées)"
}

# ------------------------------------------------------------
acte2() {
  title "ACTE 2 — Kubernetes : manifests bruts (k8s/)"
  check minikube || return
  check kubectl || return

  echo "→ Vérification du cluster minikube…"
  minikube status || minikube start --driver=docker
  pause

  echo "→ Chargement de l'image Docker dans minikube…"
  echo "  (minikube image load — 'image build' est bogué sous Windows)"
  docker build -t campusconnect .
  minikube image load campusconnect:latest
  pause

  echo "→ Déploiement de tous les manifests…"
  kubectl apply -f k8s/
  echo ""
  echo "→ Attente du pod…"
  kubectl wait --for=condition=ready pod -l app=campusconnect \
    -n campusconnect --timeout=180s
  pause

  echo "→ État du namespace :"
  kubectl get all -n campusconnect
  echo ""
  echo "→ PV / PVC (persistance SQLite) :"
  kubectl get pv,pvc -n campusconnect 2>/dev/null || kubectl get pv | grep campusconnect
  pause

  sh k8s/check.sh 2>/dev/null || true
  echo ""
  echo "🌐 Sous Windows/Docker : l'IP minikube n'est pas joignable directement."
  echo "   → kubectl port-forward -n campusconnect svc/campusconnect-clusterip 4000:80"
  echo "     puis http://localhost:4000"
  echo "   → ou 'minikube tunnel' (admin) + http://campusconnect.local (fichier hosts)"
  pause
}

# ------------------------------------------------------------
acte3() {
  title "ACTE 3 — Helm : chart campusconnect"
  check helm || return
  check kubectl || return

  echo "→ Rendu du chart sans l'installer (helm template) :"
  helm template cc ./helm/campusconnect | head -40
  pause

  echo "→ Nettoyage des manifests bruts pour repartir propre…"
  kubectl delete -f k8s/ --ignore-not-found
  pause

  echo "→ Installation du chart…"
  helm install cc ./helm/campusconnect -n campusconnect --create-namespace
  kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cc \
    -n campusconnect --timeout=180s 2>/dev/null || \
  kubectl wait --for=condition=ready pod -l app=campusconnect \
    -n campusconnect --timeout=180s
  helm list -n campusconnect
  pause

  echo "→ Upgrade simulé (changement d'une value)…"
  helm upgrade cc ./helm/campusconnect -n campusconnect \
    --set app.nodeEnv=staging
  helm history cc -n campusconnect
  pause

  echo "→ Rollback à la révision 1…"
  helm rollback cc 1 -n campusconnect
  helm history cc -n campusconnect
  echo "✅ Acte 3 terminé — helm uninstall cc -n campusconnect pour nettoyer"
}

# ------------------------------------------------------------
acte4() {
  title "ACTE 4 — Terraform : même déploiement en IaC"
  check terraform || return
  check kubectl || return

  cd terraform || return
  [ -f terraform.tfvars ] || cp terraform.tfvars.example terraform.tfvars

  echo "→ terraform init (télécharge le provider kubernetes)…"
  terraform init -input=false
  pause

  echo "→ terraform plan : ce qui SERA créé…"
  terraform plan -input=false | tail -20
  pause

  echo "→ terraform apply…"
  terraform apply -auto-approve -input=false
  pause

  echo "→ Outputs (URLs du service) :"
  terraform output
  echo ""
  kubectl get all -n campusconnect 2>/dev/null | head -12
  pause

  echo "→ terraform destroy (cycle de vie complet)…"
  terraform destroy -auto-approve -input=false
  cd ..
  echo "✅ Acte 4 terminé"
}

# ------------------------------------------------------------
case "$1" in
  1) acte1 ;;
  2) acte2 ;;
  3) acte3 ;;
  4) acte4 ;;
  "")
    echo "🎬 Démo DevOps CampusConnect — 4 actes"
    echo "   1. Docker   2. Kubernetes   3. Helm   4. Terraform"
    pause
    acte1; pause; acte2; pause; acte3; pause; acte4
    echo ""
    echo "🎉 Démo terminée."
    ;;
  *) echo "Usage: sh demo.sh [1|2|3|4]" ;;
esac
