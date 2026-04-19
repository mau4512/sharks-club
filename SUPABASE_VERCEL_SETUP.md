# Configuración Supabase + Vercel para Faraday

## 1. Crear el proyecto en Supabase

1. Entra a `https://supabase.com/dashboard`
2. Crea un proyecto nuevo
3. Espera a que termine el aprovisionamiento

## 2. Crear un usuario para Prisma

Supabase recomienda usar un usuario propio para Prisma.

En el SQL Editor de Supabase ejecuta:

```sql
create user "prisma" with password 'CAMBIA_ESTA_PASSWORD' bypassrls createdb;
grant "prisma" to "postgres";
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

## 3. Obtener las conexiones correctas

Según la documentación oficial de Supabase y Prisma:

- `DATABASE_URL`: usa el pooler de Supabase para runtime serverless
- `DIRECT_URL`: usa la conexión directa o session mode para migraciones

Valores a copiar desde Supabase:

- `DATABASE_URL`
  Usa la conexión pooled para Prisma Client en Vercel.
  Ejemplo:
  `postgresql://prisma.[PROJECT-REF]:PASSWORD@[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

- `DIRECT_URL`
  Usa la conexión directa para Prisma Migrate.
  Ejemplo:
  `postgresql://postgres:PASSWORD@db.[PROJECT-REF].supabase.co:5432/postgres`

## 4. Variables en Vercel

En Vercel agrega estas variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `PRIMARY_ADMIN_EMAIL` opcional
- `PRIMARY_ADMIN_PASSWORD_HASH` opcional

## 5. Valor correcto de NEXTAUTH_URL

Cuando Vercel te dé el dominio, usa ese valor:

```env
NEXTAUTH_URL="https://tu-proyecto.vercel.app"
```

## 6. Ejecutar migraciones

Después de configurar Supabase, desde local puedes apuntar el `.env` a Supabase y correr:

```bash
npx prisma migrate deploy
```

Si prefieres sincronizar el esquema sin generar una migración nueva:

```bash
npx prisma db push
```

## 7. Desplegar en Vercel

1. Importa el repo desde GitHub
2. Selecciona la rama que quieres desplegar
3. Verifica que el framework sea `Next.js`
4. Usa el build command:

```bash
prisma generate && next build
```

## 8. Siguiente bloqueo pendiente

La subida de imágenes aún escribe al disco local en:

- `src/app/api/deportistas/[id]/upload/route.ts`

Eso no es persistente en Vercel. Lo siguiente recomendable es moverlo a:

- Supabase Storage
- o Cloudinary
- o Vercel Blob

## Fuentes oficiales

- Supabase Prisma:
  `https://supabase.com/docs/guides/database/prisma`
- Prisma con Supabase:
  `https://www.prisma.io/docs/v6/orm/overview/databases/supabase`
