# SISTEMAS MEZZAVILLA

Sistema de Gestión de Áridos — Next.js + Supabase + Vercel

## Arquitectura

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)
- **Deploy:** Vercel (gratis)
- **Realtime:** Supabase Realtime (cambios se sincronizan entre usuarios)

---

## Guía de Deploy Paso a Paso

### PASO 1: Crear proyecto en Supabase (5 min)

1. Ir a [supabase.com](https://supabase.com) y crear una cuenta gratuita
2. Click en **"New Project"**
3. Elegir un nombre (ej: `mezzavilla`), poner una contraseña para la DB, elegir región (South America si está disponible)
4. Esperar ~2 minutos a que se cree

### PASO 2: Crear las tablas (2 min)

1. En el dashboard de Supabase, ir a **SQL Editor** (ícono en el sidebar izquierdo)
2. Click en **"New Query"**
3. Copiar y pegar TODO el contenido del archivo `supabase/schema.sql`
4. Click en **"Run"**
5. Deberías ver "Success" — las 6 tablas se crearon con datos iniciales

### PASO 3: Crear usuarios (2 min)

1. En Supabase, ir a **Authentication** → **Users**
2. Click en **"Add user"** → **"Create new user"**
3. Poner email y contraseña para cada miembro del equipo
4. Repetir para cada usuario (2-5 personas)

> **Tip:** Marcá "Auto Confirm User" para que no necesiten verificar email

### PASO 4: Obtener las API keys (1 min)

1. Ir a **Settings** → **API** en el dashboard de Supabase
2. Copiar:
   - **Project URL** (empieza con `https://...supabase.co`)
   - **anon public key** (es larga, empieza con `eyJ...`)

### PASO 5: Subir el código a GitHub (3 min)

1. Crear un repo nuevo en [github.com/new](https://github.com/new)
2. En tu computadora:

```bash
cd mezzavilla
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/mezzavilla.git
git push -u origin main
```

### PASO 6: Deploy en Vercel (3 min)

1. Ir a [vercel.com](https://vercel.com) y crear cuenta (podés usar tu cuenta de GitHub)
2. Click en **"Add New Project"**
3. Importar el repo `mezzavilla` de GitHub
4. En **"Environment Variables"**, agregar:
   - `NEXT_PUBLIC_SUPABASE_URL` → pegar el Project URL del paso 4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → pegar el anon key del paso 4
5. Click en **"Deploy"**
6. En ~1 minuto tenés tu sistema en `https://mezzavilla.vercel.app` (o el nombre que elijas)

### PASO 7: Configurar dominio (opcional)

En Vercel → Settings → Domains podés agregar un dominio propio como `sistema.mezzavilla.com`.

---

## Desarrollo Local

```bash
# 1. Clonar el repo
git clone https://github.com/TU_USUARIO/mezzavilla.git
cd mezzavilla

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus keys de Supabase

# 4. Correr en local
npm run dev
# Abrir http://localhost:3000
```

---

## Estructura del Proyecto

```
mezzavilla/
├── app/
│   ├── globals.css           # Estilos globales + Tailwind
│   ├── layout.tsx            # Layout raíz
│   ├── page.tsx              # Redirect a /stock
│   ├── login/
│   │   └── page.tsx          # Página de login
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts      # Callback de auth
│   └── (dashboard)/
│       ├── layout.tsx         # Sidebar + navegación
│       ├── stock/page.tsx     # Módulo de stock ✅ COMPLETO
│       ├── clientes/page.tsx  # Módulo de clientes (estructura)
│       ├── cantera/page.tsx   # Venta cantera (estructura)
│       └── viajes/page.tsx    # Venta viajes (estructura)
├── lib/
│   ├── hooks.ts              # Hooks de DB + tipos
│   ├── supabase-browser.ts   # Cliente Supabase (browser)
│   └── supabase-server.ts    # Cliente Supabase (server)
├── supabase/
│   └── schema.sql            # Migración SQL completa
├── middleware.ts              # Protección de rutas
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Tablas en Supabase

| Tabla | Descripción |
|-------|-------------|
| `productos` | Stock de áridos (nombre, precio, stock) |
| `clientes` | Clientes con cuenta corriente y saldo |
| `ventas_cantera` | Ventas en cantera (items en JSONB) |
| `viajes` | Ventas de viajes con estado y entrega |
| `movimientos` | Log de movimientos de stock |
| `pagos` | Pagos de clientes |

Todas las tablas tienen **RLS** (Row Level Security) habilitado — solo usuarios autenticados pueden acceder.

---

## Estado del Proyecto

- ✅ Autenticación con Supabase Auth
- ✅ Middleware de protección de rutas
- ✅ Módulo de Stock completo (CRUD con DB)
- ✅ Sidebar y navegación
- ✅ Realtime (cambios se sincronizan)
- ✅ Schema SQL con datos iniciales
- 🔲 Migrar módulo de Clientes completo
- 🔲 Migrar módulo de Cantera completo
- 🔲 Migrar módulo de Viajes completo
- 🔲 Sistema de impresión/descarga

> Los módulos de Clientes, Cantera y Viajes tienen la estructura y conexión a DB lista.
> La lógica de UI completa está en el artifact `sistema-aridos.jsx` y se puede migrar
> componente por componente.
# canteraMezzavilla
