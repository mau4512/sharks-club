# Entornos Supabase para Faraday

## Objetivo

El proyecto debe usar dos bases de datos separadas:

- Produccion: la base actual de Supabase, con datos reales.
- Staging/pruebas: un nuevo proyecto Supabase, con datos de prueba.

No se deben mezclar datos reales con pruebas.

## Mapa recomendado

```text
main
  -> Hosting de produccion
  -> Supabase produccion actual

staging o codex/faraday-testing-release
  -> Hosting preview/staging
  -> Supabase staging nuevo
```

## Variables por entorno

Produccion debe usar los valores basados en `.env.production.example`.

Staging debe usar los valores basados en `.env.staging.example`.

Las variables importantes son:

```env
DATABASE_URL=""
DIRECT_URL=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL=""
PRIMARY_ADMIN_EMAIL=""
PRIMARY_ADMIN_PASSWORD_HASH=""
```

## Que conexion de Supabase usar

Supabase muestra normalmente tres conexiones:

- Direct connection: usarla como `DIRECT_URL`.
- Transaction pooler: usarla como `DATABASE_URL` y agregar `?pgbouncer=true` al final si no lo trae.
- Session pooler: usarla como `DIRECT_URL` solo si la conexion directa falla por IPv6 o red local.

Para Prisma en hosting serverless/preview, el mapeo recomendado es:

```env
DATABASE_URL="[TRANSACTION_POOLER]?pgbouncer=true"
DIRECT_URL="[DIRECT_CONNECTION]"
```

Para pruebas locales, si `DIRECT_CONNECTION` falla, usar:

```env
DATABASE_URL="[TRANSACTION_POOLER]?pgbouncer=true"
DIRECT_URL="[SESSION_POOLER]"
```

## Crear la base de pruebas

1. Entrar a Supabase Dashboard.
2. Crear un proyecto nuevo, por ejemplo `faraday-staging`.
3. Crear el usuario `prisma` con el SQL de `SUPABASE_VERCEL_SETUP.md`.
4. Copiar las conexiones del nuevo proyecto:
   - Pooler para `DATABASE_URL`.
   - Direct connection para `DIRECT_URL`.
5. Configurar esas variables en el hosting de staging/preview.
6. Aplicar el esquema:

```bash
npx prisma db push
```

Si ya existen migraciones reales en el futuro, usar:

```bash
npx prisma migrate deploy
```

## Regla de trabajo

- Cambios nuevos se prueban primero contra Supabase staging.
- Cuando todo funciona, se suben a produccion.
- Produccion nunca debe apuntar a la base staging.
- Staging nunca debe apuntar a la base produccion.
