# LearningCards

Application d'apprentissage structuree pour developpeurs.

Le but du projet est de creer des fiches de concepts techniques, de les expliquer avec ses propres mots, d'ajouter des exemples concrets et de preparer des questions de revision.

## Stack

- React
- Vite
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- Zod

## Structure

```txt
frontend/  Application React
backend/   API Fastify, Prisma, schemas Zod
```

## Installation

```bash
npm install
```

## Variables d'environnement

Copier le fichier d'exemple :

```bash
cp backend/.env.example backend/.env
```

Puis adapter `DATABASE_URL` dans `backend/.env`.

## Commandes

Lancer le frontend :

```bash
npm run dev:web
```

Lancer l'API :

```bash
npm run dev:api
```

Generer le client Prisma :

```bash
npm run db:generate
```

Lancer les migrations :

```bash
npm run db:migrate
```

Verifier le projet :

```bash
npm run typecheck
npm run lint
```

## MVP

- Creer un concept technique
- Lister les concepts
- Voir le detail d'un concept
- Modifier et supprimer un concept
- Ajouter des questions de quiz
- Marquer un concept comme a reviser ou revise
