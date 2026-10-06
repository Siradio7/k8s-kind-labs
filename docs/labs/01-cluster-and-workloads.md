# Lab 01 — Kubernetes Cluster & Workloads

## Objectifs

L'objectif de ce lab est de découvrir les bases de Kubernetes à travers la création d'un cluster local avec Kind et la manipulation de workloads.

J'ai notamment étudié :

- la structure d'un cluster Kubernetes ;
- les nœuds Control Plane et Worker ;
- les Deployments ;
- les ReplicaSets ;
- le scaling ;
- le mécanisme de self-healing.

## 1. Création du cluster

J'ai créé un cluster Kubernetes composé de trois nœuds :

- **Control Plane** : il contient les principaux composants qui permettent de gérer le cluster et de prendre les décisions concernant son fonctionnement.
- **Worker** : il exécute les workloads Kubernetes, notamment les Pods.
- **Worker 2** : il exécute également les workloads Kubernetes.

Le cluster a été créé avec Kind, qui permet d'exécuter un cluster Kubernetes local à l'intérieur de conteneurs.

## 2. Architecture du cluster

L'architecture du cluster peut être représentée ainsi :

```text
                    Kubernetes Cluster
                           │
                  ┌────────┴────────┐
                  │   Control Plane │
                  │                 │
                  │ API Server      │
                  │ Scheduler       │
                  │ Controllers     │
                  │ etcd            │
                  └────────┬────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
       ┌─────▼─────┐               ┌─────▼─────┐
       │  Worker   │               │  Worker 2 │
       │           │               │           │
       │   Pods    │               │   Pods    │
       └───────────┘               └───────────┘
```

Le Control Plane gère le cluster tandis que les Workers exécutent les applications.

## 3. Premier Deployment

J'ai créé un Deployment nginx avec :

```bash
kubectl create deployment nginx --image=nginx:alpine
```

Un Deployment permet de déclarer un état désiré pour une application.

Par exemple, lorsqu'un Deployment possède une seule replica, Kubernetes cherche à maintenir un Pod disponible.

J'ai également constaté qu'un Pod créé et géré directement n'a pas automatiquement de mécanisme permettant de le recréer après sa suppression.

Avec un Deployment, le ReplicaSet associé maintient le nombre de Pods demandé. Si un Pod est supprimé, le ReplicaSet constate que l'état réel ne correspond plus à l'état désiré et crée un nouveau Pod.

## 4. Scaling

J'ai commencé avec une seule replica :

```text
replicas = 1
```

Puis j'ai augmenté le nombre de replicas à trois :

```bash
kubectl scale --current-replicas=1 --replicas=3 deployment/nginx
```

Kubernetes a alors créé deux Pods supplémentaires.

Le scheduler intervient ensuite pour déterminer sur quels nœuds les nouveaux Pods peuvent être placés.

Dans mon expérience, les trois Pods ont finalement été répartis sur les deux Workers :

```text
Worker
└── nginx Pod

Worker 2
├── nginx Pod
└── nginx Pod
```

## 5. Self-healing

J'ai ensuite supprimé volontairement un des Pods nginx.

Le Pod a été supprimé, mais le Deployment devait toujours maintenir trois replicas.

Le ReplicaSet a donc détecté que l'état réel ne correspondait plus à l'état désiré :

```text
État désiré : 3 Pods
État réel :   2 Pods
```

Un nouveau Pod a alors été créé automatiquement afin de revenir à :

```text
État désiré : 3 Pods
État réel :   3 Pods
```

Cette expérience m'a permis de comprendre concrètement le mécanisme de self-healing de Kubernetes.

## 6. Architecture Deployment → ReplicaSet → Pod

La relation entre ces ressources peut être représentée ainsi :

```text
Deployment
    │
    ▼
ReplicaSet
    │
    ├── Pod
    ├── Pod
    └── Pod
         │
         ▼
      Container
```

Le **Deployment** décrit l'état souhaité de l'application.

Le **ReplicaSet** veille à ce que le nombre de Pods correspondant à cet état soit maintenu.

Les **Pods** sont les unités d'exécution de Kubernetes. Un Pod peut contenir un ou plusieurs conteneurs.

Dans notre cas, chaque Pod nginx contient un conteneur exécutant nginx.

## 7. Ce que j'ai appris

À travers ce lab, j'ai appris :

- le fonctionnement général d'un cluster Kubernetes ;
- la différence entre Control Plane et Worker ;
- le rôle d'un Deployment ;
- le rôle d'un ReplicaSet ;
- le fonctionnement du scaling ;
- le mécanisme de self-healing ;
- la différence entre un Pod et un conteneur ;
- le principe d'état désiré et d'état réel dans Kubernetes.

Ce premier lab m'a surtout permis de comprendre que Kubernetes fonctionne de manière déclarative : je définis l'état que je souhaite obtenir et Kubernetes met en œuvre les mécanismes nécessaires pour maintenir cet état.