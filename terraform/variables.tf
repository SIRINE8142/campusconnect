variable "app_name" {
  description = "Nom de l'application (préfixe des ressources)"
  type        = string
  default     = "campusconnect"
}

variable "namespace" {
  description = "Namespace Kubernetes cible"
  type        = string
  default     = "campusconnect"
}

variable "kube_context" {
  description = "Contexte kubectl à utiliser (minikube, kind-kind, docker-desktop...)"
  type        = string
  default     = "minikube"
}

variable "image" {
  description = "Image Docker de l'app (buildée localement dans le daemon Minikube)"
  type        = string
  default     = "campusconnect:latest"
}

variable "database_url" {
  description = "URL de connexion Prisma (contenu du Secret)"
  type        = string
  sensitive   = true
  default     = "file:/app/data/dev.db"
}

variable "run_seed" {
  description = "Peupler la base de démo au démarrage"
  type        = bool
  default     = true
}

variable "storage_size" {
  description = "Taille du volume de données"
  type        = string
  default     = "500Mi"
}

variable "host_path" {
  description = "Chemin hôte du PV statique (dans la VM Minikube)"
  type        = string
  default     = "/data/campusconnect"
}

variable "node_port" {
  description = "Port NodePort externe (30000-32767)"
  type        = number
  default     = 30080
}

variable "enable_ingress" {
  description = "Créer la ressource Ingress NGINX"
  type        = bool
  default     = true
}

variable "ingress_host" {
  description = "Hostname de l'Ingress"
  type        = string
  default     = "campusconnect.local"
}
