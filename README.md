# Parfumerie — Salaicha Parfumeur

Architecture **Frontend + Backend** séparée, prête pour un déploiement professionnel.

## Structure

```text
parfumerie/
├── frontend/     React + Vite + TanStack Router + TanStack Query + Axios
├── backend/      Express + TypeScript + MySQL + JWT
└── README.md
```

## Prérequis

- Node.js 20+
- MySQL 8+

## Démarrage local

### 1. Backend

```bash
cd backend
cp .env.example .env
# Éditez .env (MYSQL_*, JWT_SECRET, ADMIN_*)
npm install
npm run db:init
npm run db:seed
npm run dev
```

API : `http://localhost:5000`  
Uploads : `http://localhost:5000/uploads`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Site : `http://localhost:5173`  
Admin : `http://localhost:5173/admin/login`

## Variables d'environnement

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (`.env`)

```env
PORT=5000
MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=
JWT_SECRET=
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@salaicha.sn
ADMIN_PASSWORD=
```

## API REST

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/api/products` | Public |
| GET | `/api/products/:ref` | Public |
| POST | `/api/admin/login` | Public |
| POST | `/api/admin/logout` | JWT |
| GET | `/api/admin/me` | JWT |
| GET/POST | `/api/admin/products` | JWT |
| GET/PUT/DELETE | `/api/admin/products/:id` | JWT |
| POST | `/api/upload` | JWT |

Authentification admin : header `Authorization: Bearer <token>` (JWT, 7 jours).

## Scripts

| Dossier | Commande | Description |
|---------|----------|-------------|
| frontend | `npm run dev` | Dev Vite |
| frontend | `npm run build` | Build production |
| backend | `npm run dev` | Dev avec nodemon |
| backend | `npm run build` | Compile TypeScript |
| backend | `npm start` | Lance `dist/server.js` |
| backend | `npm run db:init` | Crée le schéma MySQL |
| backend | `npm run db:seed` | Importe le catalogue |
| backend | `npm run db:reset-admin` | Réinitialise le mot de passe admin |

## Déploiement

| Composant | Plateforme suggérée |
|-----------|---------------------|
| Frontend | Vercel, Render Static Site, Netlify |
| Backend | Render Web Service, Railway |
| MySQL | Railway, Aiven, PlanetScale |

**Frontend** : définir `VITE_API_URL=https://votre-api.onrender.com/api`

**Backend** : définir `FRONTEND_URL=https://votre-site.vercel.app`, `JWT_SECRET`, variables MySQL, activer CORS.

## Fonctionnalités

- Catalogue public (parfums, diffuseurs, Doppler)
- Fiches produit + commande WhatsApp
- Administration (CRUD produits, import JSON, upload images)
- Authentification JWT
- Fallback catalogue statique si l'API est indisponible
