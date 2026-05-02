# Instrucciones para Hosting 100% Gratis

He preparado todo para que el panel funcione sin que tengas que pagar el Plan Blaze de Firebase.

### Paso 1: Base de Datos (Neon.tech)
1. Ve a [Neon.tech](https://neon.tech/) y crea una cuenta gratis.
2. Crea un nuevo proyecto y copia la **Connection String** (algo como `postgresql://user:pass@ep-ready-pool-123.us-east-2.aws.neon.tech/neondb?sslmode=require`).
3. Guarda este valor, lo usaremos en el paso 2.

### Paso 2: Backend (Render.com)
1. Ve a [Render.com](https://render.com/) y crea una cuenta gratis.
2. Haz clic en **New +** > **Web Service**.
3. Conecta tu repositorio de GitHub: **Levay23/MultiStream**.
4. Configura el servicio así:
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server build`
   - **Start Command**: `pnpm --filter @workspace/api-server start`
5. En la pestaña **Environment**, añade estas variables:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_ILmb1DnYeO9z@ep-noisy-queen-am39t9ve.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - `PORT`: `8080`
   - `NODE_ENV`: `production`
6. Una vez desplegado, copia la URL de Render (ej: `https://panelstream-api.onrender.com`).

### Paso 3: Frontend (Firebase)
Ya he subido el frontend a Firebase, pero está configurado para hablar con `https://panelstream-api.onrender.com`.
Si tu URL de Render es distinta:
1. Cambia el valor en `artifacts/streamsync-panel/.env.production`.
2. Ejecuta `pnpm --filter @workspace/streamsync-panel build`.
3. Ejecuta `firebase deploy --only hosting`.

---

**¡Listo!** Ahora tienes:
- El Frontend profesional en Firebase Hosting.
- El Backend potente en Render.
- La base de datos en Neon.
**Todo por $0 costo.**
