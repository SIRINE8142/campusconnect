# Monitoring — Prometheus & Grafana (lab Prometheus/Grafana)

Mêmes commandes que le TP, appliquées au cluster qui héberge CampusConnect.

## 1. Installer la stack

```bash
kubectl create ns monitoring

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# On garde la commande pour récupérer le mot de passe admin Grafana :
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

Après l'installation : un **StatefulSet** (Prometheus — données temporelles,
un pod nommé par instance avec son PVC) et un **DaemonSet** (Node Exporter —
1 pod par nœud pour scraper les métriques système : CPU, mémoire, disque).

## 2. Accéder aux UI

```bash
# Grafana → http://localhost:3001 (user: admin)
kubectl port-forward svc/prometheus-grafana 3001:80 -n monitoring

# Mot de passe admin Grafana :
kubectl get secret prometheus-grafana -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 -d

# Prometheus → http://localhost:9090
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
```

## 3. Ce qu'on observe sur CampusConnect

L'app n'a pas d'endpoint `/metrics` — mais elle est quand même surveillée :
le **kubelet** expose les métriques de tous les pods, donc dans Grafana on voit
CPU/mémoire/redémarrages du pod `campusconnect-*` (dashboards
"Kubernetes / Compute Resources / Pod" fournis par le chart).

Requêtes PromQL utiles dans l'UI Prometheus :

```promql
# Mémoire du pod de l'app
container_memory_working_set_bytes{namespace="campusconnect"}

# CPU de l'app
rate(container_cpu_usage_seconds_total{namespace="campusconnect"}[5m])

# Redémarrages (0 attendu)
kube_pod_container_status_restarts_total{namespace="campusconnect"}
```

## 4. (Bonus) Endpoint /metrics de l'app

Pour des métriques applicatives (requêtes HTTP, latence), il faudrait
ajouter un endpoint `/metrics` dans Next.js + un ServiceMonitor.
Le lab s'arrête au monitoring d'infrastructure — c'est documenté ici
comme piste d'extension.

## 5. Désinstallation

```bash
helm uninstall prometheus -n monitoring
kubectl delete ns monitoring
```
