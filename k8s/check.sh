#!/bin/sh
# Script de diagnostic (comme le 05-check.sh du TP) :
# vérifie l'état du déploiement CampusConnect dans Minikube.
echo "=== Pods ==="
kubectl get pods -n campusconnect -o wide

echo ""
echo "=== Services ==="
kubectl get svc -n campusconnect

echo ""
echo "=== PV / PVC ==="
kubectl get pv,pvc -n campusconnect

echo ""
echo "=== Ingress ==="
kubectl get ingress -n campusconnect

echo ""
echo "=== Derniers logs de l'app ==="
kubectl logs -n campusconnect -l app=campusconnect --tail=15

echo ""
echo "=== Test HTTP (ClusterIP depuis un pod temporaire) ==="
kubectl run curl-test --rm -i --restart=Never --image=alpine/curl:latest -n campusconnect -- \
  -s -o /dev/null -w "code=%{http_code}\n" http://campusconnect-clusterip/login
