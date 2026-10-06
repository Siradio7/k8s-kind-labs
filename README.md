# Kubernetes Kind Labs 🚀

Laboratoire pratique et progressif consacré à **Kubernetes**, construit avec **Kind**, **Docker** et **kubectl**.

L'objectif de ce projet est de comprendre Kubernetes en construisant progressivement une architecture distribuée, depuis les concepts fondamentaux jusqu'à des problématiques plus proches d'un environnement de production.

Le projet est réalisé dans le cadre de mon parcours en **Master Informatique — Systèmes logiciels et calculs distribués**.

---

## 🎯 Objectifs

Ce laboratoire a pour objectifs de :

- comprendre l'architecture et les concepts fondamentaux de Kubernetes ;
- manipuler les Pods, Deployments, ReplicaSets et Services ;
- comprendre le réseau Kubernetes et la découverte de services ;
- déployer des applications conteneurisées ;
- expérimenter le scaling horizontal ;
- observer le mécanisme de self-healing ;
- comprendre les mises à jour progressives ;
- manipuler les ConfigMaps et Secrets ;
- déployer des services stateful avec des volumes persistants ;
- mettre en place de l'observabilité ;
- progressivement construire une architecture distribuée complète ;
- expérimenter des pratiques proches d'un environnement DevOps réel.

---

## 🧰 Technologies

| Technologie | Utilisation |
|---|---|
| Kubernetes | Orchestration des conteneurs |
| Kind | Cluster Kubernetes local |
| Docker | Conteneurisation |
| kubectl | Administration du cluster |
| Node.js / Express | API applicative |
| MySQL | Base de données |
| Redis | Cache |
| Prometheus | Monitoring |
| Grafana | Visualisation |
| Git / GitHub | Versionnement |
| GitHub Actions | CI/CD |

Certaines technologies seront introduites progressivement au cours des prochains labs.

---

## 🏗️ Architecture du projet

Le projet évolue progressivement vers une architecture de ce type :

```text
                         ┌──────────────────┐
                         │       Client     │
                         │   navigateur /   │
                         │      curl        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     Ingress      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     Service      │
                         │                  │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
               ┌─────────┐   ┌─────────┐   ┌─────────┐
               │  API    │   │  API    │   │  API    │
               │  Pod    │   │  Pod    │   │  Pod    │
               └────┬────┘   └────┬────┘   └────┬────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                     ┌────────────┴────────────┐
                     ▼                         ▼
                ┌─────────┐               ┌─────────┐
                │  Redis  │               │  MySQL  │
                └─────────┘               └─────────┘
```

L'architecture finale sera construite progressivement et certains composants ne sont pas encore implémentés.

---

## 📚 Labs

### Lab 01 — Cluster & Workloads

**Statut : ✅ Terminé**

Objectifs :

- créer un cluster Kubernetes avec Kind ;
- comprendre les nœuds Kubernetes ;
- découvrir les Pods ;
- créer un Deployment ;
- comprendre le rôle du ReplicaSet ;
- effectuer un scaling ;
- expérimenter le self-healing.

Concepts étudiés :

```text
Cluster
Node
Pod
Deployment
ReplicaSet
Scheduler
Self-healing
Scaling
```

Documentation :

`docs/labs/01-cluster-and-workloads.md`

---

### Lab 02 — Services & Networking

**Statut : ✅ Terminé**

Objectifs :

- comprendre le problème des IPs des Pods ;
- créer un Service ;
- utiliser les selectors ;
- découvrir les endpoints ;
- utiliser le DNS Kubernetes ;
- observer la distribution des requêtes ;
- exposer un Service avec NodePort ;
- configurer les ports Kind.

Concepts étudiés :

```text
Service
ClusterIP
NodePort
Selector
Endpoints
EndpointSlice
DNS
Load balancing
Port mapping
```

Documentation :

`docs/labs/02-services-and-networking.md`

---

### Lab 03 — Node.js API & Kubernetes

**Statut : ✅ Terminé**

Objectifs :

- créer une API Node.js/Express ;
- construire une image Docker ;
- charger une image locale dans Kind ;
- déployer l'API avec Kubernetes ;
- exposer l'API avec un Service ;
- effectuer un scaling à plusieurs replicas ;
- observer la distribution des requêtes ;
- effectuer un RollingUpdate.

Architecture obtenue :

```text
Mac
 │
 │ localhost:3001
 ▼
NodePort
 │
 ▼
Service
 │
 ├── API Pod
 ├── API Pod
 └── API Pod
```

Concepts étudiés :

```text
Docker image
Deployment
Service
NodePort
Replicas
EndpointSlice
Scaling
RollingUpdate
Declarative configuration
```

Documentation :

`docs/labs/03-nodejs-api.md`

---

### Lab 04 — Self-Healing & Advanced Scaling

**Statut : ⏳ À venir**

Objectifs prévus :

- supprimer volontairement des Pods ;
- observer leur recréation ;
- tester plusieurs scénarios de panne ;
- approfondir le scaling ;
- comprendre le comportement du Deployment lors des changements de charge.

---

### Lab 05 — ConfigMaps & Secrets

**Statut : ⏳ À venir**

Objectifs prévus :

- externaliser la configuration ;
- utiliser des variables d'environnement ;
- créer des ConfigMaps ;
- gérer des Secrets ;
- séparer configuration et code applicatif.

---

### Lab 06 — MySQL, Redis & Persistent Storage

**Statut : ⏳ À venir**

Objectifs prévus :

- déployer MySQL ;
- utiliser des StatefulSets ;
- comprendre les PersistentVolumes ;
- utiliser les PersistentVolumeClaims ;
- déployer Redis ;
- connecter l'API Node.js à MySQL et Redis.

Architecture prévue :

```text
              API
               │
       ┌───────┴───────┐
       ▼               ▼
     Redis           MySQL
       │               │
       │               ▼
       │              PVC
       │
       ▼
     Cache
```

---

### Lab 07 — Kubernetes Networking & DNS

**Statut : ⏳ À venir**

Objectifs prévus :

- approfondir le DNS Kubernetes ;
- communiquer entre différents Services ;
- comprendre les namespaces ;
- étudier les politiques réseau ;
- analyser les flux entre composants.

---

### Lab 08 — Ingress

**Statut : ⏳ À venir**

Objectifs prévus :

- installer un Ingress Controller ;
- remplacer progressivement NodePort ;
- router plusieurs services ;
- gérer les hostnames ;
- préparer HTTPS.

Architecture prévue :

```text
                Client
                  │
                  ▼
               Ingress
               /     \
              /       \
             ▼         ▼
           API       Frontend
```

---

### Lab 09 — Probes & Resources

**Statut : ⏳ À venir**

Objectifs prévus :

- Liveness Probe ;
- Readiness Probe ;
- Startup Probe ;
- Requests CPU/mémoire ;
- Limits CPU/mémoire ;
- comprendre l'impact sur le scheduling.

---

### Lab 10 — Monitoring

**Statut : ⏳ À venir**

Objectifs prévus :

- installer Prometheus ;
- installer Grafana ;
- collecter les métriques Kubernetes ;
- surveiller les Pods ;
- créer un dashboard ;
- analyser CPU, mémoire et disponibilité.

Architecture prévue :

```text
                    Kubernetes
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          Applications          Nodes
              │                   │
              └─────────┬─────────┘
                        ▼
                   Prometheus
                        │
                        ▼
                     Grafana
```

---

## 🔄 CI/CD

Une partie du projet sera consacrée à l'automatisation du déploiement.

Objectifs prévus :

```text
Git push
   │
   ▼
GitHub Actions
   │
   ├── Tests
   ├── Build
   ├── Docker image
   └── Deployment
           │
           ▼
       Kubernetes
```

L'objectif sera de passer progressivement d'un déploiement manuel à une chaîne CI/CD automatisée.

---

## 📁 Structure du repository

```text
k8s-kind-labs/
│
├── app/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       └── server.js
│
├── kind/
│   └── cluster.yaml
│
├── kubernetes/
│   ├── nginx/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   └── api/
│       ├── deployment.yaml
│       └── service.yaml
│
├── docs/
│   └── labs/
│       ├── 01-cluster-and-workloads.md
│       ├── 02-services-and-networking.md
│       └── 03-nodejs-api.md
│
├── scripts/
│
├── .github/
│   └── workflows/
│
└── README.md
```

La structure évoluera avec l'ajout des prochains labs.

---

## 🚀 Démarrage

### Prérequis

Installer :

- Docker
- Kind
- kubectl
- Git

Vérifier les installations :

```bash
docker --version
kind version
kubectl version --client
git --version
```

### Créer le cluster

```bash
kind create cluster \
  --config kind/cluster.yaml \
  --name k8s-lab
```

Vérifier les nœuds :

```bash
kubectl get nodes
```

### Déployer les applications

Nginx :

```bash
kubectl apply -f kubernetes/nginx/
```

API :

```bash
kubectl apply -f kubernetes/api/
```

Vérifier :

```bash
kubectl get pods -o wide
kubectl get services
```

---

## 🧠 Approche pédagogique

Le projet suit une progression basée sur la pratique.

Chaque laboratoire introduit progressivement de nouveaux concepts et s'appuie sur les précédents.

L'objectif n'est pas seulement de mémoriser des commandes `kubectl`, mais de comprendre :

```text
Pourquoi ?
   ↓
Quel problème Kubernetes résout ?
   ↓
Quel objet Kubernetes utiliser ?
   ↓
Comment Kubernetes fonctionne-t-il ?
   ↓
Comment vérifier son comportement ?
```

Les expériences sont volontairement réalisées sur un cluster local afin de pouvoir observer directement le comportement de Kubernetes.

---

## 📈 Progression

```text
                    Kubernetes
                        │
                        ▼
              ┌──────────────────┐
              │ Cluster & Pods   │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Services & DNS   │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Node.js + Docker │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Scaling & Update │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Config & Secrets │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ MySQL + Redis    │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Ingress & Network│
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Monitoring       │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ CI/CD            │
              └──────────────────┘
```

---

## 🎓 Compétences développées

À travers ce projet, les compétences travaillées sont notamment :

- Kubernetes ;
- Docker ;
- orchestration de conteneurs ;
- architecture distribuée ;
- réseaux et services ;
- scaling horizontal ;
- haute disponibilité ;
- self-healing ;
- déploiements progressifs ;
- configuration déclarative ;
- Infrastructure as Code ;
- observabilité ;
- CI/CD ;
- administration Linux ;
- Git et GitHub.

---

## 📌 État actuel

**Labs terminés : 3**

```text
✅ Lab 01 — Cluster & Workloads
✅ Lab 02 — Services & Networking
✅ Lab 03 — Node.js API & Kubernetes

⏳ Lab 04 — Self-Healing & Advanced Scaling
⏳ Lab 05 — ConfigMaps & Secrets
⏳ Lab 06 — MySQL, Redis & Persistent Storage
⏳ Lab 07 — Networking & DNS
⏳ Lab 08 — Ingress
⏳ Lab 09 — Probes & Resources
⏳ Lab 10 — Monitoring
⏳ CI/CD
```

---

## 👨‍💻 Auteur

**Mamadou Siradiou Diallo**

Master Informatique — Systèmes logiciels et calculs distribués

Projet personnel de mise en pratique autour de Kubernetes, Docker, DevOps et des architectures distribuées.