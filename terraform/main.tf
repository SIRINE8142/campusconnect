# Terraform — déploie CampusConnect sur le cluster local (minikube ou kind).
# Même ressources que k8s/ mais décrites en Infrastructure-as-Code :
# un seul "terraform apply" crée namespace, stockage, config, app et exposition.

terraform {
  required_version = ">= 1.5"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

# Le provider lit le kubeconfig local (~/.kube/config) —
# contexte "minikube" ou "kind" selon le cluster utilisé.
provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = var.kube_context
}

# ---------- Namespace ----------
resource "kubernetes_namespace" "app" {
  metadata {
    name = var.namespace
  }
}

# ---------- PV + PVC : persistance de dev.db (SQLite) ----------
resource "kubernetes_persistent_volume" "data" {
  metadata {
    name = "${var.app_name}-pv"
    labels = { app = var.app_name }
  }
  spec {
    capacity = { storage = var.storage_size }
    access_modes = ["ReadWriteOnce"]
    persistent_volume_reclaim_policy = "Retain"
    storage_class_name = ""
    persistent_volume_source {
      host_path {
        path = var.host_path
        type = "DirectoryOrCreate"
      }
    }
    claim_ref {
      name      = "${var.app_name}-pvc"
      namespace = var.namespace
    }
  }
}

resource "kubernetes_persistent_volume_claim" "data" {
  metadata {
    name      = "${var.app_name}-pvc"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  spec {
    access_modes       = ["ReadWriteOnce"]
    storage_class_name = ""
    resources {
      requests = { storage = var.storage_size }
    }
  }
}

# ---------- ConfigMap : configuration non sensible ----------
resource "kubernetes_config_map" "app" {
  metadata {
    name      = "${var.app_name}-config"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  data = {
    NODE_ENV                 = "production"
    PORT                     = "3000"
    RUN_SEED                 = tostring(var.run_seed)
    NEXT_TELEMETRY_DISABLED  = "1"
  }
}

# ---------- Secret : données sensibles ----------
resource "kubernetes_secret" "app" {
  metadata {
    name      = "${var.app_name}-secret"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  data = {
    DATABASE_URL = var.database_url
  }
}

# ---------- Deployment ----------
resource "kubernetes_deployment" "app" {
  metadata {
    name      = var.app_name
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  spec {
    # replicas = 1 obligatoire : SQLite + ReadWriteOnce = 1 seul pod
    replicas = 1
    selector {
      match_labels = { app = var.app_name }
    }
    template {
      metadata {
        labels = { app = var.app_name }
      }
      spec {
        container {
          name              = "app"
          image             = var.image
          image_pull_policy = "IfNotPresent"
          port {
            container_port = 3000
          }
          env_from {
            config_map_ref {
              name = kubernetes_config_map.app.metadata[0].name
            }
          }
          env {
            name = "DATABASE_URL"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.app.metadata[0].name
                key  = "DATABASE_URL"
              }
            }
          }
          volume_mount {
            name       = "data"
            mount_path = "/app/data"
          }
          readiness_probe {
            http_get {
              path = "/login"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }
          liveness_probe {
            http_get {
              path = "/login"
              port = 3000
            }
            initial_delay_seconds = 30
            period_seconds        = 15
          }
        }
        volume {
          name = "data"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.data.metadata[0].name
          }
        }
      }
    }
  }
}

# ---------- Services : ClusterIP + NodePort (Lab 1) ----------
resource "kubernetes_service" "clusterip" {
  metadata {
    name      = "${var.app_name}-clusterip"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  spec {
    type     = "ClusterIP"
    selector = { app = var.app_name }
    port {
      port        = 80
      target_port = 3000
    }
  }
}

resource "kubernetes_service" "nodeport" {
  metadata {
    name      = "${var.app_name}-nodeport"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  spec {
    type     = "NodePort"
    selector = { app = var.app_name }
    port {
      port        = 80
      target_port = 3000
      node_port   = var.node_port
    }
  }
}

# ---------- Ingress (Lab 2) ----------
resource "kubernetes_ingress_v1" "app" {
  count = var.enable_ingress ? 1 : 0
  metadata {
    name      = "${var.app_name}-ingress"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  spec {
    ingress_class_name = "nginx"
    rule {
      host = var.ingress_host
      http {
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service.clusterip.metadata[0].name
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }
}
