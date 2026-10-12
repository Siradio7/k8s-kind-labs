# Lab 04 — Scaling et Self-Healing avec Kubernetes

## Objectifs

L'objectif de ce laboratoire est de comprendre comment Kubernetes adapte le nombre de Pods d'une application et comment il réagit lorsqu'un Pod est supprimé.

Ce laboratoire me permet de mettre en pratique plusieurs notions :

- le scaling horizontal d'un Deployment ;
- l'augmentation et la réduction du nombre de réplicas ;
- le rôle du ReplicaSet dans le maintien de l'état souhaité ;
- le remplacement automatique d'un Pod supprimé ;
- la différence entre configuration déclarative et modification directe du cluster ;
- la gestion du nombre de réplicas à partir d'un manifeste Kubernetes ;
- la vérification de l'état d'un Deployment.

J'ai réalisé les manipulations sur mon API Node.js `k8s-kind-api`, déjà déployée dans mon cluster Kind `k8s-lab`.

---

## 1. Vérification de l'état initial

### 1.1 Vérification du cluster

Avant de commencer les manipulations, j'ai vérifié que les trois nœuds de mon cluster étaient opérationnels :

```bash
kubectl get nodes
```

Les résultats ont confirmé que les trois nœuds étaient `Ready` :

```text
k8s-lab-control-plane
k8s-lab-worker
k8s-lab-worker2
```

Mon cluster était donc opérationnel et je pouvais poursuivre les manipulations.

### 1.2 Vérification du Deployment

J'ai ensuite vérifié l'état du Deployment de mon API :

```bash
kubectl get deployment k8s-kind-api
```

Le résultat initial indiquait :

```text
NAME           READY   UP-TO-DATE   AVAILABLE
k8s-kind-api   3/3     3            3
```

Mon application disposait de trois réplicas prêts.

J'ai également affiché les Pods et les nœuds sur lesquels ils étaient exécutés :

```bash
kubectl get pods -o wide -l app=k8s-kind-api
```

Les résultats ont montré que les Pods étaient répartis sur les deux workers du cluster.

Cette première vérification m'a permis de confirmer que mon application fonctionnait correctement avant de modifier le nombre de réplicas.

---

## 2. Scaling horizontal de l'API

### 2.1 Passage de trois à cinq réplicas

Dans un premier temps, j'ai augmenté le nombre de réplicas de mon Deployment à cinq :

```bash
kubectl scale deployment k8s-kind-api --replicas=5
```

J'ai ensuite vérifié la progression du déploiement :

```bash
kubectl rollout status deployment/k8s-kind-api
```

Le résultat obtenu était :

```text
deployment "k8s-kind-api" successfully rolled out
```

Enfin, j'ai vérifié le nombre de Pods disponibles :

```bash
kubectl get deployment k8s-kind-api
kubectl get pods -o wide -l app=k8s-kind-api
```

Le Deployment affichait alors :

```text
NAME           READY   UP-TO-DATE   AVAILABLE
k8s-kind-api   5/5     5            5
```

Kubernetes a créé deux Pods supplémentaires pour atteindre les cinq réplicas demandés.

Cette manipulation m'a permis de comprendre le principe du scaling horizontal : au lieu d'augmenter les ressources d'une seule instance, j'augmente le nombre d'instances de mon application.

### 2.2 Observation de la répartition des Pods

J'ai utilisé la commande suivante pour observer la répartition des Pods sur les workers :

```bash
kubectl get pods -o wide -l app=k8s-kind-api
```

Les deux nouveaux Pods ont été placés sur `k8s-lab-worker`, tandis que les trois Pods déjà présents étaient répartis entre les deux workers.

J'ai constaté que Kubernetes choisit le nœud sur lequel placer un Pod en fonction des contraintes et des ressources disponibles. Il ne garantit pas nécessairement une répartition parfaitement équilibrée entre les nœuds.

---

## 3. Self-Healing : remplacement automatique d'un Pod

### 3.1 Suppression manuelle d'un Pod

Après avoir obtenu cinq réplicas opérationnels, j'ai voulu vérifier comment Kubernetes réagit lorsqu'un Pod disparaît.

J'ai d'abord affiché la liste des Pods :

```bash
kubectl get pods -o wide -l app=k8s-kind-api
```

J'ai ensuite supprimé volontairement l'un d'entre eux :

```bash
kubectl delete pod k8s-kind-api-6dcc7cfdb8-4cd4c
```

Kubernetes a confirmé la suppression du Pod.

### 3.2 Observation du remplacement

Après la suppression, j'ai exécuté :

```bash
kubectl get pods -l app=k8s-kind-api
```

Le résultat a montré qu'un nouveau Pod avait été créé :

```text
k8s-kind-api-6dcc7cfdb8-g5wkl
```

J'ai ensuite affiché les adresses IP et les nœuds associés aux Pods :

```bash
kubectl get pods -o wide -l app=k8s-kind-api
```

Le nouveau Pod possédait une nouvelle adresse IP et était exécuté sur `k8s-lab-worker`.

J'ai ainsi constaté que le nombre de Pods était revenu à cinq sans avoir besoin de recréer manuellement le Pod supprimé.

### 3.3 Rôle du ReplicaSet

Cette expérience m'a permis de mieux comprendre le rôle du ReplicaSet.

Le Deployment gère le déploiement de mon application et s'appuie sur un ReplicaSet pour maintenir le nombre de réplicas souhaité.

Lorsque j'ai supprimé un Pod, le ReplicaSet a constaté que le nombre réel d'instances était inférieur au nombre demandé. Il a alors créé un Pod de remplacement.

Le mécanisme peut être représenté de la manière suivante :

```text
Deployment
    |
    v
ReplicaSet
    |
    | Vérification du nombre de Pods
    |
    v
Création d'un Pod de remplacement
    |
    v
Retour à 5 réplicas
```

Cette manipulation m'a permis d'observer concrètement le mécanisme de self-healing de Kubernetes.

J'ai également constaté que le nouveau Pod ne reprend pas l'identité de l'ancien. Il possède un nouveau nom et une nouvelle adresse IP.

Cette expérience démontre le remplacement d'un Pod supprimé. Elle ne suffit pas à démontrer le comportement du cluster en cas de panne complète d'un nœud, qui constitue un scénario différent.

---

## 4. Configuration déclarative du Deployment

### 4.1 Différence entre le cluster et le manifeste YAML

Après les premières manipulations, j'ai constaté une différence entre la configuration de mon cluster et celle du fichier `deployment.yaml`.

La commande utilisée pour augmenter le nombre de réplicas était :

```bash
kubectl scale deployment k8s-kind-api --replicas=5
```

Cette commande modifiait directement le nombre de réplicas dans le cluster.

Cependant, le fichier `kubernetes/api/deployment.yaml` contenait encore :

```yaml
spec:
  replicas: 3
```

Mon cluster disposait donc de cinq réplicas, alors que mon manifeste en déclarait trois.

J'ai compris qu'une modification effectuée directement dans le cluster ne met pas automatiquement à jour le fichier YAML de mon projet.

### 4.2 Modification du manifeste

J'ai ouvert le fichier suivant :

```text
kubernetes/api/deployment.yaml
```

J'ai ensuite remplacé :

```yaml
replicas: 3
```

par :

```yaml
replicas: 5
```

Le manifeste contient désormais le nombre de réplicas souhaité pour mon API.

### 4.3 Application de la configuration

Après avoir modifié le fichier, j'ai appliqué la configuration :

```bash
kubectl apply -f kubernetes/api/deployment.yaml
```

Kubernetes a confirmé la prise en compte de la modification :

```text
deployment.apps/k8s-kind-api configured
```

J'ai ensuite vérifié l'état du Deployment :

```bash
kubectl get deployment k8s-kind-api
```

Le résultat indiquait :

```text
NAME           READY   UP-TO-DATE   AVAILABLE
k8s-kind-api   5/5     5            5
```

Mon manifeste et l'état du cluster étaient désormais cohérents.

Cette étape m'a permis de comprendre l'intérêt de l'approche déclarative : la configuration souhaitée est conservée dans un fichier versionnable avec Git, ce qui facilite la reproduction de l'environnement.

---

## 5. Vérification du scaling dans les deux sens

### 5.1 Réduction temporaire à deux réplicas

Pour vérifier que Kubernetes pouvait également réduire le nombre d'instances, j'ai exécuté :

```bash
kubectl scale deployment k8s-kind-api --replicas=2
```

J'ai ensuite vérifié le Deployment et les Pods :

```bash
kubectl get deployment k8s-kind-api
kubectl get pods -l app=k8s-kind-api
```

Le résultat obtenu était :

```text
NAME           READY   UP-TO-DATE   AVAILABLE
k8s-kind-api   2/2     2            2
```

Kubernetes a réduit le nombre de Pods de cinq à deux.

Cette manipulation m'a montré que le scaling horizontal ne consiste pas uniquement à ajouter des instances. Il permet également de réduire leur nombre lorsque cela est demandé.

### 5.2 Restauration à cinq réplicas

Comme mon manifeste déclarait désormais cinq réplicas, j'ai utilisé celui-ci pour restaurer la configuration souhaitée :

```bash
kubectl apply -f kubernetes/api/deployment.yaml
```

J'ai attendu la fin du déploiement :

```bash
kubectl rollout status deployment/k8s-kind-api
```

Le résultat était :

```text
deployment "k8s-kind-api" successfully rolled out
```

J'ai ensuite vérifié l'état final :

```bash
kubectl get deployment k8s-kind-api
kubectl get pods -o wide -l app=k8s-kind-api
```

Le Deployment affichait :

```text
NAME           READY   UP-TO-DATE   AVAILABLE
k8s-kind-api   5/5     5            5
```

Trois nouveaux Pods avaient été créés pour compléter les deux instances conservées lors de la réduction.

Cette manipulation m'a permis d'observer comment Kubernetes restaure l'état déclaré dans le manifeste lorsque je l'applique à nouveau.

---

## 6. Commandes importantes

### Vérifier le cluster

```bash
kubectl get nodes
```

### Vérifier le Deployment

```bash
kubectl get deployment k8s-kind-api
```

### Afficher les Pods et leur répartition

```bash
kubectl get pods -o wide -l app=k8s-kind-api
```

### Augmenter le nombre de réplicas

```bash
kubectl scale deployment k8s-kind-api --replicas=5
```

### Réduire le nombre de réplicas

```bash
kubectl scale deployment k8s-kind-api --replicas=2
```

### Supprimer un Pod pour tester le self-healing

```bash
kubectl delete pod NOM_DU_POD
```

### Appliquer le manifeste

```bash
kubectl apply -f kubernetes/api/deployment.yaml
```

### Vérifier la fin du déploiement

```bash
kubectl rollout status deployment/k8s-kind-api
```

---

## 7. Ce que j'ai appris

- J'ai appris à augmenter et à réduire le nombre de réplicas d'un Deployment.
- J'ai compris que le ReplicaSet maintient le nombre de Pods demandé.
- J'ai observé qu'un Pod supprimé est automatiquement remplacé lorsqu'il est géré par un Deployment.
- J'ai constaté qu'un Pod de remplacement possède un nouveau nom et peut recevoir une nouvelle adresse IP.
- J'ai compris que Kubernetes ne garantit pas une répartition parfaitement équilibrée des Pods entre les nœuds.
- J'ai appris que `kubectl scale` modifie directement le nombre de réplicas dans le cluster.
- J'ai compris l'intérêt de conserver la configuration souhaitée dans un manifeste YAML versionné avec Git.
- J'ai utilisé `kubectl apply` pour restaurer le nombre de réplicas déclaré dans le manifeste.
- J'ai vérifié que le scaling fonctionne dans les deux sens, en augmentant ou en diminuant le nombre d'instances.

---

## 8. Conclusion

Ce laboratoire m'a permis de comprendre plus concrètement comment Kubernetes maintient le nombre de réplicas de mon application et réagit lorsqu'un Pod est supprimé.

J'ai pu observer le scaling horizontal en passant de trois à cinq réplicas, puis de cinq à deux avant de restaurer la configuration déclarée dans le manifeste YAML.

La suppression volontaire d'un Pod m'a également permis de constater le mécanisme de self-healing : Kubernetes a créé automatiquement un remplacement pour revenir au nombre de réplicas souhaité.

Enfin, la différence entre les modifications directes du cluster et la configuration déclarative m'a permis de mieux comprendre l'intérêt de conserver les manifestes dans Git.

Ce laboratoire constitue une nouvelle étape dans ma compréhension de Kubernetes avant d'aborder la configuration des applications avec les ConfigMaps et les Secrets, puis la gestion des ressources, les probes de santé et le stockage persistant.