{{/* Nom complet de la release (ex. cc-campusconnect) */}}
{{- define "campusconnect.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Labels communs à toutes les ressources */}}
{{- define "campusconnect.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/* Labels de sélection des pods */}}
{{- define "campusconnect.selectorLabels" -}}
app: {{ .Chart.Name }}
{{- end -}}
