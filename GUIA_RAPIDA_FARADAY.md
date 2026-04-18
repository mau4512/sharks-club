# 🚀 GUÍA RÁPIDA - Club Faraday

## Iniciar el Proyecto Faraday

### Paso 1: Abrir terminal en la carpeta del proyecto
```bash
cd /Users/mauricioaguilar/Desktop/faraday_project
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Iniciar servicios Docker (PostgreSQL + PgAdmin)
```bash
docker-compose up -d
```

Esta acción levantará:
- PostgreSQL en puerto **5433**
- PgAdmin en puerto **5051**

### Paso 4: Ejecutar migraciones de Prisma
```bash
npx prisma migrate dev
```

### Paso 5: Iniciar servidor de desarrollo
```bash
npm run dev
```

### Paso 6: Abrir en navegador
```
http://localhost:3000
```

---

## 🔑 Credenciales y Accesos

### PostgreSQL
- **Host**: localhost
- **Puerto**: 5433
- **Usuario**: faraday
- **Contraseña**: faraday_password
- **Base de datos**: faraday_basketball

### PgAdmin (Administrador de BD)
- **URL**: http://localhost:5051
- **Email**: admin@faraday.com
- **Contraseña**: admin

### Aplicación
- **URL**: http://localhost:3000
- **Credenciales**: Las mismas del proyecto original

---

## 🎨 Colores del Club Faraday (Tailwind)

```
primary-500 → #1e3a8a (Azul marino - color principal)
primary-600 → #1e40af (Azul más claro)
accent-500 → #f59e0b (Dorado - color de acento)
```

Todos configurados en `tailwind.config.ts`

---

## Diferencias vs mvpskills_project

| Elemento | Faraday |
|----------|---------|
| Puerto BD | 5433 |
| Usuario BD | faraday |
| Base de datos | faraday_basketball |
| Puerto PgAdmin | 5051 |
| Colores | Azul marino + Dorado |

---

## 🛑 Detener Docker
```bash
docker-compose down
```

## 🔄 Reiniciar Todo
```bash
docker-compose down
docker-compose up -d
npx prisma migrate dev
npm run dev
```

---

**Proyecto creado**: Febrero 17, 2026
**Para**: Club Faraday
**Stack**: Next.js 14 + PostgreSQL + Tailwind CSS
