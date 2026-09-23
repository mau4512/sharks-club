# Inactividad y mensualidades

Desde el historial de asistencias, el administrador puede filtrar por estado,
inactivar, reactivar y eliminar deportistas, previa confirmación.
Eliminar usa el borrado definitivo existente: también elimina los registros
relacionados por las relaciones en cascada de la base de datos.

Cada cambio de estado conserva su fecha en `periodosInactividad`. En el plan
regular, S/ 180 cubren 12 sesiones de lunes, miércoles y viernes: S/ 15 por
sesión programada durante el periodo activo, con un máximo de S/ 180 al mes.
Martes y jueves son de regalo o recuperación y no suman cobro. La asistencia
real no determina el cobro: una falta mientras esté activo no reduce la cuota.
Si hay 13 o 14 sesiones regulares en el mes, el cobro se limita a 12.
Con una tarifa especial se divide esa tarifa mensual entre 12.

Se usan fechas de Perú (UTC-5): el día de baja es inactivo y el día de
reactivación es activo. Los planes de 8 y 4 sesiones de fin de semana mantienen
el prorrateo por días calendario hasta definir sus reglas específicas.
El plan diario de 20 sesiones usa la misma base regular de 12 sesiones pagadas.

Los meses completamente inactivos no generan mensualidad; las deudas de
periodos anteriores se conservan. Los pagos existentes se aplican contra el
importe proporcional. Las exoneraciones y becas mantienen su prioridad.
Los uniformes no se prorratean. Caja utiliza la misma proporción para su meta.

Ejemplo: baja el 15 de abril de 2026: se cobran las sesiones de los días
1, 3, 6, 8, 10 y 13 de abril. Seis sesiones × S/ 15 = S/ 90.

## Base de datos

Antes de ejecutar la versión actualizada, aplicar la migración
`prisma/migrations/20260923120000_add_periodos_inactividad/migration.sql`
mediante el procedimiento de despliegue del entorno y regenerar Prisma Client.
La migración no se aplica automáticamente al ejecutar `prisma generate`.

Los deportistas que ya estaban inactivos reciben un periodo abierto desde el
momento de la migración. No se reconstruye una fecha de baja anterior porque
el sistema no la almacenaba; esos ajustes históricos requieren fechas verificadas.

## Gestión del entrenador

En Mis Deportistas, el entrenador puede inactivar por lesión u otro motivo,
reactivar y eliminar definitivamente, siempre con confirmación. La lista muestra
los deportistas de sus turnos. El motivo se guarda en el periodo de inactividad
y se conserva al reactivar; no modifica las reglas de prorrateo.
