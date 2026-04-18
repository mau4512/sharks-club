# Basketball Training Tracker - Club Faraday

## Descripción del Proyecto
Aplicación web completa para el seguimiento de entrenamientos de baloncesto del Club Faraday, con identidad visual corporativa (azul marino y dorado).

## Stack Tecnológico
- Next.js 14 con TypeScript
- React para componentes UI
- Tailwind CSS con colores de Faraday (azul #1e3a8a + dorado #f59e0b)
- PostgreSQL 16 con Prisma ORM
- Recharts para visualización de datos
- Docker para contenedores

## Características Principales
- ✅ Autenticación de usuarios (deportistas, entrenadores, admin)
- ✅ Gestión de ejercicios y entrenamientos
- ✅ Registro de sesiones con métricas
- ✅ Cálculo de porcentajes de tiro
- ✅ Seguimiento de desarrollo físico
- ✅ Reportes y estadísticas comparativas (mensual, trimestral)
- ✅ Panel administrativo completo
- ✅ Gestión de horarios/turnos
- ✅ Historial de asistencias
- ✅ Visualización de progreso con gráficos

## Configuración de Base de Datos - FARADAY
- **URL**: postgresql://faraday:faraday_password@localhost:5433/faraday_basketball
- **Puerto PostgreSQL**: 5433
- **Puerto PgAdmin**: 5051
- **Email Admin**: admin@faraday.com

## Colores Corporativos del Club Faraday
- Primario: #1e3a8a (Azul marino)
- Acento: #f59e0b (Dorado)
- Configurados en: `tailwind.config.ts`

## Estado del Proyecto
- [x] Copia de estructura base completada
- [x] Docker-compose configurado para Faraday
- [x] Variables de entorno (.env.local) configuradas
- [x] Tailwind.config.ts personalizado con colores de Faraday
- [x] Base de datos PostgreSQL independiente lista
- [ ] npm install en proyecto Faraday
- [ ] Migraciones Prisma ejecutadas
- [ ] Servidor de desarrollo iniciado
- [ ] Verificación en navegador
