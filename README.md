# SICOP Copilot

**Tu copiloto inteligente para contratar con el Estado costarricense.**

> "El Estado compra ₡3.2 billones al año. Ahora vos podés ganar tu parte."

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes (serverless)
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: Anthropic Claude API
- **Deploy**: Vercel
- **Emails**: Resend

## Setup local

### 1. Clonar e instalar

```bash
git clone https://github.com/TU_USUARIO/sicop-copilot.git
cd sicop-copilot
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
# Completar los valores en .env.local
```

### 3. Base de datos

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ejecutar `supabase/migrations/001_initial_schema.sql` en el SQL Editor de Supabase
3. Copiar la URL y las keys en `.env.local`

### 4. Correr en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/          # Login, registro
│   ├── (dashboard)/     # Páginas protegidas
│   │   ├── dashboard/
│   │   ├── analisis/
│   │   ├── alertas/
│   │   ├── explorar/
│   │   ├── mercado/
│   │   └── consorcios/
│   ├── api/             # API Routes
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # shadcn/ui
│   ├── layout/          # Sidebar, Header
│   ├── dashboard/
│   ├── analisis/
│   └── ...
├── lib/
│   ├── supabase/        # Clientes Supabase
│   ├── anthropic.ts     # Claude API
│   └── ...
├── types/               # TypeScript types
└── store/               # Zustand
```

## Roadmap

- [x] Fase 0: Setup + Auth
- [ ] Fase 1: Ingesta de datos SICOP + Explorador
- [x] Fase 2: Análisis de carteles con IA
- [x] Fase 3: Dashboard + Alertas + Cron
- [ ] Fase 4: Red de consorcios
- [ ] Fase 5: Monetización (Stripe/Paddle)

## Contribuir

Ver los issues en GitHub para las tareas activas. Cada feature va en su propia rama `fase-N-nombre` o `fix/descripcion`.

## Licencia

Privado — SICOP Copilot © 2026
