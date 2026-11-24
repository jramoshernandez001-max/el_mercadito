# 🏪 El Mercadito

**Todo lo que Lorica produce y ofrece, a un clic de distancia.**
El primer directorio y mercado digital hiperlocal de Lorica, Córdoba: los emprendedores publican su perfil gratis y los compradores los encuentran por categoría o zona y les escriben directo por WhatsApp.

## Funcionalidades

- **Público:** inicio con categorías, anuncio local y "Descubre hoy"; explorador con búsqueda en vivo y filtros por categoría, zona y tipo; perfil de cada negocio con catálogo y botones de WhatsApp con mensaje listo; páginas de *Cómo funciona* y *Planes*.
- **Emprendedores:** ingreso sin contraseña (enlace al correo), creación y edición del perfil, logo y fotos de productos (se comprimen en el navegador), estadísticas de visitas y clics, solicitud de Premium.
- **Administrador:** aprobar o rechazar Premium, cambiar planes, ocultar o eliminar perfiles, editar el anuncio de portada y ver métricas.
- **Visibilidad equitativa:** el orden rota cada día (hora Colombia) igual para todos. Pagar no da mejor posición.

## Tecnología

Next.js 16 (App Router, TypeScript, Tailwind CSS v4) + Supabase (Postgres, Auth, Storage). Desplegable en Vercel.

La seguridad vive en la base de datos (Row Level Security y triggers), no solo en la interfaz:

| Regla | Dónde se aplica |
| --- | --- |
| Cada usuario edita solo su negocio y sus productos | Políticas RLS en `negocios` y `productos` |
| Nadie se pone Premium ni se "desoculta" solo | Trigger `proteger_negocio` |
| Límite de catálogo: 6 (Básico) / 15 (Premium) | Trigger `limitar_productos` |
| Métricas únicas por visitante y día; solo las ve el dueño o el admin | Función `registrar_evento` + RLS en `eventos` |
| Cada usuario sube imágenes solo a su carpeta | Políticas de Storage en el bucket `imagenes` |

---

## Puesta en marcha (paso a paso)

### 1. Crear el proyecto en Supabase
1. Entra a [supabase.com](https://supabase.com), crea una cuenta y un proyecto nuevo (región recomendada: **East US**, la más cercana a Colombia). Guarda la contraseña de la base de datos.
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/migrations/0001_esquema_inicial.sql` y dale **Run**. Debe terminar con "Success".
3. Ve a **Project Settings → API** y copia la **Project URL** y la **anon public key**.

### 2. Correrlo en tu computador
```bash
git clone https://github.com/jramoshernandez001-max/el_mercadito.git
cd el_mercadito
npm install
cp .env.example .env.local   # y pega ahí la URL y la anon key
npm run dev
```
Abre http://localhost:3000.

En Supabase, ve a **Authentication → URL Configuration** y agrega `http://localhost:3000/**` en **Redirect URLs**.

### 3. Volverte administrador
1. Ingresa a la app con tu correo (botón **Ingresar**) y abre el enlace que te llega.
2. En Supabase → **SQL Editor**, ejecuta (con tu correo):
```sql
update public.perfiles set es_admin = true
where id = (select id from auth.users where email = 'tucorreo@gmail.com');
```
3. Recarga la app: aparece la pestaña **Admin**.

### 4. Publicar en internet con Vercel
1. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub → **Add New → Project** → importa `el_mercadito`.
2. En **Environment Variables** agrega las mismas de `.env.local`. En `NEXT_PUBLIC_SITE_URL` pon la URL que te dé Vercel (por ejemplo `https://el-mercadito.vercel.app`).
3. Dale **Deploy**.
4. En Supabase → **Authentication → URL Configuration**:
   - **Site URL:** tu URL de Vercel.
   - **Redirect URLs:** agrega `https://TU-URL.vercel.app/**`.

### 5. Asistente de pedidos con IA (plan Premium)
1. Crea una llave en [console.anthropic.com](https://console.anthropic.com) (requiere cargar crédito).
2. En Vercel → **Settings → Environment Variables** agrega `ANTHROPIC_API_KEY` con esa llave y vuelve a desplegar.
3. El asistente aparece solo en perfiles **Premium**. Límites para cuidar el gasto: 40 mensajes por visitante al día y 400 por tienda al día (función `consumir_asistente`).

### 6. Correos de acceso (importante antes de lanzar)
El servidor de correo que trae Supabase por defecto **solo envía unos pocos correos por hora** y es para pruebas. Antes de abrirlo a los emprendedores de Lorica:
1. Crea una cuenta gratis en [resend.com](https://resend.com) (3.000 correos/mes gratis).
2. En Supabase → **Authentication → Emails → SMTP Settings**, activa *Custom SMTP* con los datos de Resend.
3. Opcional: en **Authentication → Emails → Templates** traduce el correo de *Magic Link* al español.

---

## Estructura

```
src/
  app/
    page.tsx              Inicio
    explorar/             Búsqueda y filtros (en vivo)
    n/[slug]/             Perfil público del negocio
    como-funciona/        Guía para compradores y emprendedores
    planes/               Básico, Premium, Anuncio local
    ingresar/             Acceso con enlace mágico
    auth/confirm, salir   Rutas de sesión
    mi-negocio/           Panel del emprendedor
    admin/                Panel del administrador
    api/evento/           Registro de visitas y clics
  components/             Tarjetas, navegación, métricas
  lib/                    Datos, rotación, clientes de Supabase
  proxy.ts                Refresca la sesión y protege rutas privadas
supabase/migrations/      Esquema SQL completo
```

## Cambiar precios, categorías o zonas
- Precios y límites: `src/lib/datos.ts` (`PRECIO_PREMIUM`, `PRECIO_ANUNCIO`, `LIMITE`). Si cambias los límites, actualiza también la función `limitar_productos` en SQL.
- Categorías y zonas: `src/lib/datos.ts` **y** los `check` de la tabla `negocios` en SQL (deben coincidir).

---
Proyecto de Emprendimiento e Innovación Tecnológica · Universidad de Córdoba, sede Lorica · Juan Angel Ramos
