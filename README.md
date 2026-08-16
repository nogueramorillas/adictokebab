# Adicto Kebab — versión local

Aplicación web del restaurante **Adicto Kebab** (Mercado Cerdanyola, Local 5,
Mataró) lista para ejecutarse en tu ordenador (Windows + VS Code) con `npm`.
Incluye el frontend (React + Vite) y el backend (Express + PostgreSQL) en un
solo proyecto.

> Esta es una versión **independiente** del proyecto: sin monorepo de pnpm,
> sin paquetes `@workspace/*` ni nada específico de Replit. Todo el código
> está dentro de este proyecto y puedes editarlo libremente.

---

## 1. Requisitos previos

- **Node.js 20.19 o superior** (recomendado 22 LTS) → https://nodejs.org
  (instala la versión LTS). Vite 7 no funciona con versiones de Node 20 antiguas.
- **PostgreSQL** (la base de datos). Dos opciones:
  - **Local**: instala PostgreSQL (https://www.postgresql.org/download/windows/) y
    crea una base de datos vacía, por ejemplo `adictokebab`.
  - **En la nube (gratis y más fácil)**: crea una base de datos en
    [Neon](https://neon.tech) o [Supabase](https://supabase.com) y copia su
    cadena de conexión (`postgresql://...`).

---

## 2. Configuración (solo la primera vez)

1. Abre la carpeta del proyecto en VS Code.
2. Abre una terminal (menú **Terminal → New Terminal**).
3. Copia el archivo de ejemplo de variables de entorno:
   ```bash
   copy .env.example .env
   ```
   (en Mac/Linux: `cp .env.example .env`)
4. Abre el archivo **`.env`** y rellena los valores:
   - `DATABASE_URL` → la cadena de conexión a tu PostgreSQL.
   - `SESSION_SECRET` → cualquier texto largo y aleatorio.
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` → el usuario y contraseña del panel de administración.
5. Instala las dependencias:
   ```bash
   npm install
   ```
6. Crea las tablas en la base de datos:
   ```bash
   npm run db:push
   ```

---

## 3. Arrancar la aplicación

```bash
npm run dev
```

Esto arranca a la vez:
- el **frontend** en http://localhost:5173  ← abre esta dirección en el navegador
- el **backend** (API) en http://localhost:3001

El frontend reenvía automáticamente las llamadas `/api` al backend, así que solo
necesitas abrir **http://localhost:5173**.

### Páginas principales

- `/` — carta y pedidos (cliente)
- `/admin` — panel de administración y repartidores (usuario/contraseña del `.env`)
- `/seguimiento/:token` — seguimiento del pedido (cliente, sin login)

Los repartidores `usuario1` … `usuario10` se crean automáticamente al arrancar
(contraseña inicial = el propio nombre de usuario); puedes cambiarlas desde el
panel **Equipo**.

---

## 4. Comandos disponibles

| Comando             | Qué hace                                                        |
| ------------------- | -------------------------------------------------------------- |
| `npm run dev`       | Arranca frontend + backend juntos (modo desarrollo).           |
| `npm run dev:web`   | Solo el frontend (Vite).                                        |
| `npm run dev:api`   | Solo el backend (Express).                                      |
| `npm run build`     | Compila el frontend para producción (carpeta `dist/`).         |
| `npm run typecheck` | Comprueba los tipos de TypeScript (frontend y backend).        |
| `npm run db:push`   | Crea/actualiza las tablas de la base de datos.                 |

---

## 5. Estructura del proyecto

```
adicto-kebab-local/
├── index.html              # Punto de entrada del frontend
├── package.json            # Dependencias y comandos
├── vite.config.ts          # Configuración de Vite (proxy /api → backend)
├── tailwind.config.js      # Configuración de Tailwind CSS
├── postcss.config.js       # PostCSS (procesa Tailwind)
├── tsconfig.json           # TypeScript del frontend
├── tsconfig.server.json    # TypeScript del backend
├── drizzle.config.ts       # Configuración de la base de datos
├── .env.example            # Plantilla de variables de entorno
│
├── public/                 # Imágenes estáticas (favicon, etc.)
│
├── src/                    # FRONTEND (React)
│   ├── main.tsx            # Arranque de React
│   ├── App.tsx             # Rutas
│   ├── index.css           # Estilos globales + tema (Tailwind)
│   ├── pages/              # Páginas (Home, Admin, Tracking, …)
│   ├── components/         # Componentes (incluye ui/ de shadcn)
│   ├── hooks/               # Hooks reutilizables
│   ├── lib/                # Carta (menu.ts), carrito (cart.tsx), utilidades
│   ├── assets/              # Imágenes de los platos
│   └── api/                 # Cliente de la API (hooks generados + tipos)
│
└── server/                 # BACKEND (Express)
    ├── index.ts            # Arranque del servidor
    ├── app.ts              # Configuración de Express
    ├── routes/              # Rutas de la API (orders, auth, track, …)
    ├── lib/                 # Auth, ETA, seed de usuarios, logger
    ├── db/                   # Esquema de la base de datos (Drizzle)
    └── zod/                  # Esquemas de validación (Zod)
```

---

## 6. Notas

- **Dónde editar la carta**: `src/lib/menu.ts` (un solo sitio para la carta del
  cliente y el constructor de pedidos del personal). También se puede editar
  desde el panel **Carta** dentro de `/admin` sin tocar código.
- **Páginas legales**: `src/pages/Privacy.tsx` y `src/pages/LegalNotice.tsx`
  contienen marcadores `[COMPLETAR POR EL NEGOCIO]` que debes rellenar (titular,
  NIF/CIF, teléfono, email) antes de publicar. La dirección ya está rellenada
  (Mercado Cerdanyola, Local 5, c/ d'Atenes 11, Mataró).
- El tiempo estimado de entrega (ETA) se calcula con OpenStreetMap (gratis, sin
  clave), tomando como origen las coordenadas de Mataró (`SHOP_LAT`/`SHOP_LNG`
  en `.env`). Si falla, el personal puede ponerlo a mano desde el panel.
- Si el puerto 3001 o 5173 está ocupado, cámbialos en `.env` (`PORT`) y en
  `vite.config.ts` (`server.port` y el destino del `proxy`).
