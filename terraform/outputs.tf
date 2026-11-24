output "namespace" {
  value = kubernetes_namespace.app.metadata[0].name
}

output "clusterip_service" {
  value = "http://${kubernetes_service.clusterip.metadata[0].name}.${var.namespace}.svc.cluster.local"
}

output "nodeport_access" {
  value = "minikube service ${kubernetes_service.nodeport.metadata[0].name} -n ${var.namespace}"
}

output "ingress_url" {
  value = var.enable_ingress ? "http://${var.ingress_host} (ajouter l'IP minikube dans /etc/hosts)" : "Ingress désactivé"
}
