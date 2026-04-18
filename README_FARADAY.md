# Basketball Training Tracker - Club Faraday

Proyecto de seguimiento de entrenamientos de baloncesto para el Club Faraday.

## 🎨 Colores del Club Faraday

- **Azul Principal**: #1e3a8a (Azul marino corporativo)
- **Dorado/Amarillo**: #f59e0b (Color de acento)

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Docker y Docker Compose
- PostgreSQL 16

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Iniciar Base de Datos
```bash
docker-compose up -d
```

### 3. Configurar Base de Datos
```bash
npx prisma migrate dev
```

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Acceso a Base de Datos

### PostgreSQL
- **Host**: localhost
- **Puerto**: 5433
- **Usuario**: faraday
- **Contraseña**: faraday_password
- **Base de Datos**: faraday_basketball

### PgAdmin
- **URL**: http://localhost:5051
- **Email**: admin@faraday.com
- **Contraseña**: admin

## 📁 Estructura del Proyecto

```
faraday_project/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Componentes React
│   ├── lib/             # Utilidades y constantes
│   └── api/             # Rutas API
├── prisma/
│   └── schema.prisma    # Esquema de base de datos
├── public/              # Archivos estáticos
├── docker-compose.yml   # Configuración Docker
└── .env.local          # Variables de entorno
```

## ✨ Características Principales

- 📊 Seguimiento de ejercicios
- 🎯 Cálculo de porcentajes de tiro
- 📈 Métricas de desarrollo físico
- 📅 Comparativas mensuales y trimestrales
- 📉 Visualización de progreso con gráficos

## 🔧 Stack Tecnológico

- **Framework**: Next.js 14 con TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Estilos**: Tailwind CSS
- **Gráficos**: Recharts
- **Herramientas**: Docker, npm, Git

## 📝 Variables de Entorno

Configuradas en `.env.local`:

```
DATABASE_URL="postgresql://faraday:faraday_password@localhost:5433/faraday_basketball"
NEXTAUTH_SECRET="faraday_secret_key_2026"
NEXTAUTH_URL="http://localhost:3000"
```

## 🤝 Contribuyentes

Proyecto desarrollado para Club Faraday - Febrero 2026

## 📄 Licencia

Todos los derechos reservados © 2026 Club Faraday
