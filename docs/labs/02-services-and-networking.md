# Lab 02 — Services & Networking

## Objectifs

L'objectif de ce lab est de comprendre comment Kubernetes permet aux applications de communiquer entre elles et comment exposer une application à l'extérieur du cluster.

J'ai notamment étudié :

- le problème des IPs des Pods ;
- les Services Kubernetes ;
- les selectors et les endpoints ;
- le DNS Kubernetes ;
- la répartition des requêtes entre plusieurs Pods ;
- le type de Service NodePort ;
- le port mapping avec Kind.

## 1. Le problème des IPs des Pods

Les Pods Kubernetes ont leur propre adresse IP, mais cette adresse n'est pas stable.

Lorsqu'un Pod est supprimé puis recréé, le nouveau Pod peut obtenir une adresse IP différente.

Par exemple, mes Pods nginx avaient les adresses :

```text
10.244.1.2
10.244.1.3
10.244.2.2
```

Il serait donc risqué pour une application de communiquer directement avec ces adresses.

Il est préférable d'utiliser un Service Kubernetes qui fournit un point d'accès stable devant les Pods.

## 2. Création d'un Service ClusterIP

J'ai créé un Service de type `ClusterIP` pour mon Deployment nginx.

Le Service fournit une adresse IP stable à l'intérieur du cluster :

```text
Service nginx
ClusterIP: 10.96.x.x
Port: 80
```

Le Service permet ainsi de communiquer avec les Pods sans dépendre directement de leurs adresses IP.

## 3. Selector et Endpoints

Le Service utilise un selector :

```yaml
selector:
  app: nginx
```

Ce selector permet au Service de sélectionner les Pods qui possèdent le label correspondant :

```yaml
app: nginx
```

Les endpoints correspondent aux adresses des Pods sélectionnés par le Service.

Dans mon expérience, le Service nginx possédait trois endpoints correspondant aux trois Pods nginx.

On peut représenter le fonctionnement ainsi :

```text
Service nginx
     │
     │ selector: app=nginx
     │
     ├───────────┐
     ▼           ▼
  Pod nginx    Pod nginx
     │
     ▼
  Pod nginx
```

## 4. DNS Kubernetes

Kubernetes fournit un système DNS permettant de résoudre les noms des Services.

J'ai pu tester ce mécanisme depuis un Pod temporaire avec :

```bash
curl http://nginx
```

La requête a fonctionné sans que j'aie besoin de connaître l'adresse IP du Service ou des Pods.

Le chemin est donc :

```text
Pod client
    │
    │ http://nginx
    ▼
DNS Kubernetes
    │
    ▼
Service nginx
    │
    ▼
Pods nginx
```

Le DNS permet donc d'utiliser le nom du Service plutôt que de devoir connaître directement son adresse IP.

## 5. Load balancing entre les Pods

Mon Service nginx possède trois Pods derrière lui.

J'ai effectué plusieurs requêtes :

```bash
curl http://nginx
```

Depuis un Pod client.

Les réponses provenaient de plusieurs Pods différents :

```text
nginx-7b8b87776c-9vf45
nginx-7b8b87776c-xq9mb
nginx-7b8b87776c-sd599
```

Cela m'a permis d'observer concrètement que le Service distribue les requêtes entre les différents Pods disponibles.

Le Service fournit donc un point d'accès unique devant plusieurs instances de l'application.

## 6. Exposition avec NodePort

Le Service `ClusterIP` est accessible à l'intérieur du cluster.

Pour permettre l'accès au Service via un nœud Kubernetes, j'ai utilisé un Service de type `NodePort`.

Le Service utilise :

```text
Port:       80
TargetPort: 80
NodePort:   30080
```

La différence entre les ports est la suivante :

```text
NodePort 30080
     │
     ▼
Service port 80
     │
     ▼
Pod port 80
```

Le NodePort permet donc d'exposer le Service via un port du nœud Kubernetes.

## 7. Port mapping avec Kind

Lors du premier test avec le NodePort, j'ai essayé d'accéder au Service avec :

```bash
curl http://localhost:30412
```

Cela n'a pas fonctionné.

Le problème venait du fait que le port NodePort Kubernetes n'était pas publié vers le système hôte.

J'ai donc configuré Kind avec un `extraPortMappings` :

```yaml
extraPortMappings:
  - containerPort: 30080
    hostPort: 8080
    protocol: TCP
```

Le chemin devient alors :

```text
Mac
 │
 │ localhost:8080
 ▼
Kind
 │
 │ port 30080
 ▼
Kubernetes NodePort
 │
 ▼
Service nginx
 │
 ├── Pod
 ├── Pod
 └── Pod
```

Après avoir recréé le cluster avec cette configuration, j'ai pu accéder à nginx depuis mon Mac :

```bash
curl http://localhost:8080
```

et obtenir la page par défaut de nginx.

## 8. Architecture finale

L'architecture finale du lab est :

```text
                         macOS
                           │
                    localhost:8080
                           │
                           ▼
                  ┌─────────────────┐
                  │   Kind Mapping  │
                  │  8080 → 30080   │
                  └────────┬────────┘
                           │
                           ▼
                    Kubernetes
                    NodePort 30080
                           │
                           ▼
                   ┌─────────────┐
                   │Service nginx│
                   │ ClusterIP   │
                   │ port 80     │
                   └──────┬──────┘
                          │
                    selector:
                     app=nginx
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           Pod nginx   Pod nginx   Pod nginx
```

Pour les communications internes au cluster :

```text
Pod client
    │
    │ http://nginx
    ▼
DNS Kubernetes
    │
    ▼
Service nginx
    │
    ├──► Pod nginx
    ├──► Pod nginx
    └──► Pod nginx
```

## 9. Ce que j'ai appris

À travers ce lab, j'ai appris :

- pourquoi les IPs des Pods ne doivent pas être utilisées comme point d'accès stable ;
- le rôle des Services Kubernetes ;
- le fonctionnement des selectors ;
- la relation entre un Service et ses endpoints ;
- le fonctionnement du DNS Kubernetes ;
- la répartition des requêtes entre plusieurs Pods ;
- la différence entre `ClusterIP` et `NodePort` ;
- le rôle du port mapping de Kind pour accéder au cluster depuis ma machine locale.

Ce lab m'a permis de comprendre qu'un Service fournit une abstraction stable devant des Pods dont les adresses IP peuvent changer.