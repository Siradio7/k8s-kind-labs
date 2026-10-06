# Lab 03 — Déploiement d'une API Node.js dans Kubernetes

## Objectifs

L'objectif de ce laboratoire est de déployer une application Node.js dans un cluster Kubernetes créé avec Kind.

Ce laboratoire permet de mettre en pratique plusieurs notions vues précédemment :

- création d'une API avec Node.js et Express ;
- conteneurisation avec Docker ;
- création et versionnement d'images Docker ;
- chargement d'une image locale dans Kind ;
- déploiement avec un Deployment Kubernetes ;
- exposition avec un Service NodePort ;
- réplication d'une application ;
- distribution des requêtes entre plusieurs Pods ;
- mise à jour progressive avec RollingUpdate ;
- différence entre configuration déclarative et modification directe du cluster.

---

## 1. Création de l'API Node.js

### 1.1 Structure du projet

L'application a été créée dans le dossier `app/` :

```text
app/
├── Dockerfile
├── package.json
├── package-lock.json
└── src/
    └── server.js
```

L'application utilise **Node.js** et **Express**.

### 1.2 API Express

L'API possède deux endpoints principaux :

| Endpoint | Méthode | Rôle |
|---|---|---|
| `/` | GET | Retourne les informations de l'application et du Pod |
| `/health` | GET | Vérifie que l'application fonctionne |

L'application écoute sur le port `3000` et sur `0.0.0.0`.

Le fait d'utiliser `0.0.0.0` est important dans un conteneur car l'application doit pouvoir accepter des connexions provenant de l'extérieur du conteneur.

### 1.3 Test en local

Avant d'utiliser Docker ou Kubernetes, l'application a été testée directement avec Node.js.

```bash
curl http://localhost:3000
```

Résultat :

```json
{
  "message": "Hello from Kubernetes!",
  "service": "k8s-kind-api",
  "version": "1.0.0"
}
```

Le endpoint de santé a également été testé :

```bash
curl http://localhost:3000/health
```

Résultat :

```json
{
  "status": "UP"
}
```

Cette étape permet de vérifier que l'application fonctionne correctement avant d'introduire Docker et Kubernetes.

---

## 2. Conteneurisation avec Docker

### 2.1 Dockerfile

Un `Dockerfile` a été créé dans le dossier `app/` :

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### 2.2 Construction de l'image

L'image Docker a été construite avec :

```bash
docker build -t k8s-kind-api:1.0 ./app
```

L'image obtenue est :

```text
k8s-kind-api:1.0
```

Une nouvelle version a ensuite été créée lorsque le hostname du Pod a été ajouté dans les réponses de l'API :

```bash
docker build -t k8s-kind-api:1.1 ./app
```

Enfin, une version plus cohérente a été créée :

```bash
docker build -t k8s-kind-api:1.1.0 ./app
```

Cette dernière version retourne notamment :

```json
{
  "message": "Hello from Kubernetes!",
  "service": "k8s-kind-api",
  "version": "1.1.0",
  "hostname": "k8s-kind-api-..."
}
```

Le hostname permet d'identifier le Pod qui traite la requête.

### 2.3 Pourquoi utiliser une image Docker ?

Kubernetes ne déploie pas directement le code source Node.js.

Il déploie des conteneurs à partir d'images.

Le chemin est donc :

```text
Code source
    ↓
Dockerfile
    ↓
Image Docker
    ↓
Conteneur
    ↓
Pod Kubernetes
```

Docker permet donc de fournir à Kubernetes un environnement reproductible contenant l'application et ses dépendances.

---

## 3. Chargement de l'image dans Kind

L'image Docker a été créée localement sur Docker Desktop.

Cependant, les nœuds du cluster Kind sont eux-mêmes des conteneurs Docker. L'image locale n'est donc pas automatiquement disponible à l'intérieur de ces nœuds.

Nous avons utilisé :

```bash
kind load docker-image k8s-kind-api:1.0 --name k8s-lab
```

Puis pour les versions suivantes :

```bash
kind load docker-image k8s-kind-api:1.1 --name k8s-lab
```

et :

```bash
kind load docker-image k8s-kind-api:1.1.0 --name k8s-lab
```

L'image a ainsi été chargée sur les différents nœuds du cluster.

Cette étape permet d'utiliser une image locale sans avoir besoin de la publier sur Docker Hub ou un autre registre.

---

## 4. Déploiement de l'API dans Kubernetes

### 4.1 Deployment

Le Deployment se trouve dans :

```text
kubernetes/api/deployment.yaml
```

Il permet de déclarer l'état souhaité de notre application.

La configuration finale utilise :

```yaml
spec:
  replicas: 3

  selector:
    matchLabels:
      app: k8s-kind-api

  template:
    metadata:
      labels:
        app: k8s-kind-api

    spec:
      containers:
        - name: api
          image: k8s-kind-api:1.1.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
```

Le Deployment indique notamment :

- le nom de l'application ;
- le nombre souhaité de replicas ;
- le label permettant d'identifier les Pods ;
- l'image Docker utilisée ;
- le port utilisé par l'application.

### 4.2 Application du manifest

Le Deployment a été créé avec :

```bash
kubectl apply -f kubernetes/api/deployment.yaml
```

Kubernetes a alors créé un ReplicaSet puis les Pods correspondants.

La relation est :

```text
Deployment
     ↓
ReplicaSet
     ↓
Pods
     ↓
Conteneurs
```

### 4.3 Vérification

Les Pods ont été vérifiés avec :

```bash
kubectl get pods -l app=k8s-kind-api -o wide
```

À la fin du laboratoire, trois Pods étaient en fonctionnement :

```text
k8s-kind-api-6dcc7cfdb8-4cd4c   Running
k8s-kind-api-6dcc7cfdb8-p77tl   Running
k8s-kind-api-6dcc7cfdb8-vbzhh   Running
```

Les Pods étaient répartis sur plusieurs nœuds du cluster Kind.

---

## 5. Exposition de l'API avec un Service

### 5.1 Service Kubernetes

Le Service se trouve dans :

```text
kubernetes/api/service.yaml
```

Il utilise le type `NodePort` :

```yaml
apiVersion: v1
kind: Service

metadata:
  name: k8s-kind-api

spec:
  type: NodePort

  selector:
    app: k8s-kind-api

  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30001
```

Le Service permet de fournir un point d'accès stable aux Pods.

Les Pods peuvent être supprimés et recréés avec de nouvelles adresses IP. Le Service permet de ne pas dépendre directement de ces IPs.

### 5.2 Rôle du selector

Le selector :

```yaml
selector:
  app: k8s-kind-api
```

permet au Service de sélectionner les Pods portant le label :

```yaml
app: k8s-kind-api
```

Le Service peut donc automatiquement découvrir les Pods correspondant à cette application.

### 5.3 Vérification

Le Service a été vérifié avec :

```bash
kubectl get service k8s-kind-api
```

Il a été créé avec :

```text
NAME           TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)
k8s-kind-api   NodePort   ...            <none>        3000:30001/TCP
```

Cela signifie :

```text
Service port : 3000
NodePort     : 30001
```

---

## 6. Accès depuis la machine locale

### 6.1 Configuration de Kind

Pour rendre le NodePort accessible depuis le Mac, le port `30001` a été ajouté dans :

```text
kind/cluster.yaml
```

Configuration utilisée :

```yaml
extraPortMappings:
  - containerPort: 30080
    hostPort: 8080
    protocol: TCP

  - containerPort: 30001
    hostPort: 3001
    protocol: TCP
```

Le premier mapping permet d'accéder à nginx :

```text
localhost:8080 → 30080
```

Le second permet d'accéder à l'API :

```text
localhost:3001 → 30001
```

### 6.2 Chemin d'accès

L'accès à notre API suit donc ce chemin :

```text
Mac
 │
 │ localhost:3001
 ▼
Kind
 │
 │ NodePort 30001
 ▼
Service k8s-kind-api
 │
 │ targetPort 3000
 ▼
Pod Node.js
 │
 │ :3000
 ▼
Express
```

### 6.3 Test

L'API a été testée avec :

```bash
curl http://localhost:3001
```

Résultat :

```json
{
  "message": "Hello from Kubernetes!",
  "service": "k8s-kind-api",
  "version": "1.1.0",
  "hostname": "k8s-kind-api-6dcc7cfdb8-vbzhh"
}
```

Le endpoint de santé a également été testé :

```bash
curl http://localhost:3001/health
```

---

## 7. Scaling de l'API

### 7.1 Passage à plusieurs replicas

Dans un premier temps, le Deployment possédait un seul replica.

Nous avons utilisé :

```bash
kubectl scale deployment k8s-kind-api --replicas=3
```

Kubernetes a alors créé deux Pods supplémentaires.

Cependant, cette modification était uniquement appliquée à l'état courant du cluster.

Après avoir recréé le cluster Kind, cette modification a été perdue car elle n'était pas présente dans le manifest.

Nous avons donc rendu la configuration déclarative en indiquant directement :

```yaml
replicas: 3
```

dans `deployment.yaml`.

### 7.2 Vérification

La commande :

```bash
kubectl get pods -l app=k8s-kind-api -o wide
```

a montré trois Pods :

```text
k8s-kind-api-77f69c89d6-7vxql   Running   k8s-lab-worker
k8s-kind-api-77f69c89d6-bsh67   Running   k8s-lab-worker
k8s-kind-api-77f69c89d6-ztbft   Running   k8s-lab-worker2
```

Kubernetes a donc maintenu trois instances de notre application.

### 7.3 Pourquoi utiliser plusieurs Pods ?

Plusieurs replicas permettent notamment :

- de répartir les requêtes ;
- d'améliorer la disponibilité de l'application ;
- de continuer à servir des requêtes lorsqu'un Pod disparaît ;
- de préparer l'application à une montée en charge.

Kubernetes peut automatiquement créer de nouveaux Pods lorsque le nombre réel de Pods est inférieur au nombre souhaité.

---

## 8. Service et distribution des requêtes

### 8.1 Vérification des endpoints

Les endpoints du Service ont été vérifiés avec :

```bash
kubectl get endpoints k8s-kind-api
```

Les trois Pods étaient présents :

```text
10.244.1.5:3000
10.244.1.6:3000
10.244.2.5:3000
```

Kubernetes a cependant affiché un avertissement indiquant que l'objet `Endpoints` est déprécié dans les versions récentes.

L'alternative recommandée est désormais :

```bash
kubectl get endpointslice
```

### 8.2 Test de plusieurs requêtes

Pour identifier le Pod qui répond, l'application retourne son hostname.

Nous avons envoyé plusieurs requêtes :

```bash
for i in {1..20}; do curl -s http://localhost:3001; echo; done
```

Les réponses ont montré plusieurs hostnames différents :

```text
k8s-kind-api-77f69c89d6-ztbft
k8s-kind-api-77f69c89d6-7vxql
k8s-kind-api-77f69c89d6-bsh67
```

### 8.3 Observation

Les requêtes ont donc bien été distribuées entre les différents Pods.

Il ne faut cependant pas s'attendre à un ordre strict de type :

```text
Pod A
Pod B
Pod C
Pod A
Pod B
Pod C
```

Le Service distribue le trafic entre ses endpoints, mais ne garantit pas une alternance parfaite entre les Pods.

Cette expérience permet de voir concrètement le rôle du Service dans une architecture composée de plusieurs replicas.

---

## 9. Mise à jour de l'application

### 9.1 Première version

La première image utilisée était :

```text
k8s-kind-api:1.0
```

Elle retournait notamment :

```json
{
  "message": "Hello from Kubernetes!",
  "service": "k8s-kind-api",
  "version": "1.0.0"
}
```

### 9.2 Ajout du hostname

L'application a ensuite été modifiée pour utiliser le module Node.js `os` :

```javascript
const os = require("os");
```

Le hostname du Pod a été ajouté à la réponse :

```javascript
hostname: os.hostname()
```

Cela permettait d'identifier quelle instance de l'application traitait chaque requête.

### 9.3 Nouvelle image

Une nouvelle image a été construite :

```bash
docker build -t k8s-kind-api:1.1.0 ./app
```

Puis chargée dans Kind :

```bash
kind load docker-image k8s-kind-api:1.1.0 --name k8s-lab
```

Le Deployment a ensuite été modifié pour utiliser :

```yaml
image: k8s-kind-api:1.1.0
```

### 9.4 RollingUpdate

Après modification du Deployment :

```bash
kubectl apply -f kubernetes/api/deployment.yaml
```

Kubernetes a effectué automatiquement une mise à jour progressive.

La progression a été vérifiée avec :

```bash
kubectl rollout status deployment/k8s-kind-api
```

Résultat :

```text
deployment "k8s-kind-api" successfully rolled out
```

Les anciens Pods ont progressivement été remplacés par les nouveaux.

Cette stratégie permet de mettre à jour une application sans supprimer simultanément toutes ses instances.

### 9.5 Vérification de la nouvelle version

Le test :

```bash
curl http://localhost:3001
```

a retourné :

```json
{
  "message": "Hello from Kubernetes!",
  "service": "k8s-kind-api",
  "version": "1.1.0",
  "hostname": "k8s-kind-api-6dcc7cfdb8-vbzhh"
}
```

Cela confirme que le nouveau code est bien exécuté par Kubernetes.

---

## 10. État runtime et configuration déclarative

Une notion importante a été observée pendant ce laboratoire.

### Modification runtime

La commande :

```bash
kubectl scale deployment k8s-kind-api --replicas=3
```

modifie directement l'état du cluster.

Cependant, si le cluster est supprimé puis recréé, cette modification disparaît.

### Configuration déclarative

En ajoutant :

```yaml
replicas: 3
```

dans `deployment.yaml`, l'état souhaité est stocké dans le repository Git.

Cette approche permet de reconstruire le même environnement après la suppression du cluster.

Cela correspond mieux à une approche **Infrastructure as Code / configuration as code**.

Le repository devient donc une source de vérité pour l'infrastructure Kubernetes.

---

## 11. Architecture finale

```text
                              Mac
                               │
                               │ localhost:3001
                               ▼
                    ┌─────────────────────┐
                    │     Kind Node       │
                    │      :30001         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Kubernetes Service  │
                    │    k8s-kind-api      │
                    │      :3000           │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          ┌────────────┐ ┌────────────┐ ┌────────────┐
          │   Pod 1    │ │   Pod 2    │ │   Pod 3    │
          │  Node.js   │ │  Node.js   │ │  Node.js   │
          │   :3000    │ │   :3000    │ │   :3000    │
          └────────────┘ └────────────┘ └────────────┘
                 │             │             │
                 ▼             ▼             ▼
              Express       Express       Express
```

Le Deployment garantit le nombre souhaité de Pods tandis que le Service fournit un point d'accès stable et distribue les requêtes vers les Pods disponibles.

---

## 12. Ce que j'ai appris

- Une application Node.js peut être transformée en image Docker puis déployée dans Kubernetes.
- Kubernetes déploie des conteneurs à partir d'images.
- Une image Docker locale doit être chargée dans Kind pour pouvoir être utilisée par les nœuds du cluster.
- Un Deployment permet de gérer les replicas d'une application.
- Un Pod possède sa propre IP, mais cette IP n'est pas destinée à être utilisée comme point d'accès permanent.
- Un Service fournit un point d'accès stable aux Pods.
- Un selector permet à un Service de sélectionner les Pods correspondant à certains labels.
- Un NodePort permet d'exposer un Service sur un port d'un nœud Kubernetes.
- Avec Kind, `extraPortMappings` permet de rendre ce port accessible depuis la machine locale.
- Plusieurs replicas permettent de distribuer les requêtes entre plusieurs instances de l'application.
- Le nombre de replicas peut être déclaré directement dans le manifest Kubernetes.
- Un RollingUpdate permet de remplacer progressivement les anciennes versions d'une application.
- La configuration déclarative est préférable pour conserver une infrastructure reproductible et versionnée avec Git.
- EndpointSlice est aujourd'hui la méthode recommandée pour observer les endpoints d'un Service dans les versions récentes de Kubernetes.

---

## 13. Difficultés rencontrées

### Problème 1 — Image Docker locale non disponible dans Kind

L'image Docker créée localement n'était pas automatiquement disponible dans les nœuds Kind.

Solution :

```bash
kind load docker-image k8s-kind-api:1.0 --name k8s-lab
```

---

### Problème 2 — NodePort inaccessible depuis le Mac

Le Service NodePort existait dans Kubernetes mais le port n'était pas publié vers la machine locale.

Solution : ajouter un `extraPortMappings` dans la configuration Kind.

```yaml
- containerPort: 30001
  hostPort: 3001
  protocol: TCP
```

---

### Problème 3 — Le scaling n'a pas survécu à la recréation du cluster

Le scaling avait été réalisé avec :

```bash
kubectl scale deployment k8s-kind-api --replicas=3
```

Mais cette configuration n'était pas présente dans le manifest.

Après la recréation du cluster, un seul Pod a donc été créé.

Solution : déclarer directement :

```yaml
replicas: 3
```

dans le Deployment.

---

### Problème 4 — Confusion entre version Docker et version de l'application

L'image Docker `1.1.0` ne signifie pas automatiquement que l'application retourne `"version": "1.1.0"`.

Cette valeur était initialement codée en dur dans le code source.

La version de l'application a donc été mise à jour explicitement dans `server.js`.

---

## 14. Commandes importantes

### Construire une image

```bash
docker build -t k8s-kind-api:1.1.0 ./app
```

### Charger une image dans Kind

```bash
kind load docker-image k8s-kind-api:1.1.0 --name k8s-lab
```

### Déployer

```bash
kubectl apply -f kubernetes/api/
```

### Vérifier le Deployment

```bash
kubectl get deployment k8s-kind-api
```

### Vérifier les Pods

```bash
kubectl get pods -l app=k8s-kind-api -o wide
```

### Scaler

```bash
kubectl scale deployment k8s-kind-api --replicas=3
```

### Vérifier le Service

```bash
kubectl get service k8s-kind-api
```

### Vérifier les EndpointSlices

```bash
kubectl get endpointslice
```

### Vérifier le déploiement progressif

```bash
kubectl rollout status deployment/k8s-kind-api
```

### Vérifier l'image utilisée

```bash
kubectl get deployment k8s-kind-api \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

### Tester l'API

```bash
curl http://localhost:3001
```

```bash
curl http://localhost:3001/health
```

---

## 15. Conclusion

Ce laboratoire m'a permis de passer d'une simple application Node.js exécutée localement à une application conteneurisée et orchestrée par Kubernetes.

J'ai pu comprendre concrètement le rôle du Deployment, du ReplicaSet, des Pods et du Service.

J'ai également expérimenté le scaling horizontal et observé la distribution des requêtes entre plusieurs instances de l'application.

Enfin, la mise en place d'un RollingUpdate m'a permis de comprendre comment Kubernetes peut remplacer progressivement une version d'une application par une nouvelle version.

Ce laboratoire constitue donc une première étape vers une architecture plus complète basée sur Kubernetes, avec notamment la possibilité d'ajouter par la suite des ConfigMaps, Secrets, volumes persistants, probes, Ingress, monitoring et une chaîne CI/CD.