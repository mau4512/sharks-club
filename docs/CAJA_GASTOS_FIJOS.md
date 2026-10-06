# Caja: abonos a gastos fijos y resumen por turno

Antes de desplegar, aplicar `prisma/migrations/20261006120000_link_egresos_gastos_fijos/migration.sql` a la base de datos del entorno correspondiente y generar el cliente con `npx prisma generate`. La migración añade dos campos opcionales y una relación; conserva los egresos existentes.

En Caja, abrir **Gastos fijos** y usar **Registrar abono / pago**. El formulario propone el saldo restante; para adelantos, cambiarlo por el importe efectivamente pagado. El mes de la obligación puede diferir de la fecha del egreso. El egreso se resta una sola vez de caja, según la fecha del pago. La obligación muestra Pendiente, Parcial o Cancelado según sus abonos del mes.

Para pagos anteriores, editar el egreso y seleccionar **Aplicar a gasto fijo** y **Mes de la obligación**. No se vinculan automáticamente por coincidencias de nombre. Editar o eliminar un abono recalcula el pendiente. Los pagos en exceso muestran saldo cero y conservan el total pagado. Las obligaciones se renuevan cada mes.

**Ingresos y saldos por turno** usa el turno actual del deportista (no reconstruye traslados históricos). Cobrado suma todos los pagos recibidos en el mes seleccionado. Mensualidad cubierta distribuye los pagos por sus meses de cobertura, incluidos adelantos y anualidades. Saldo por cobrar suma lo pendiente de cada alumno, sin compensar la deuda de uno con el exceso de otro, y respeta becas, exoneraciones, tarifas y periodos de inactividad. Los alumnos sin grupo aparecen como Sin turno asignado. Este reporte no asigna egresos a los turnos.

## Demo local

Ejecutar `node scripts/seed-local-caja.js` con PostgreSQL local disponible y luego `npm run dev -- --hostname 127.0.0.1`. El script carga el entorno de desarrollo, rechaza servidores de base de datos remotos, aplica la migración de caja si falta y agrega 4 turnos, 24 deportistas, 16 pagos y 3 gastos fijos de prueba (uno parcial, uno cancelado y uno pendiente). Puede ejecutarse otra vez sin duplicar datos ni sobrescribir cambios hechos en la demo. Los nombres llevan “Prueba” o “Demo”.
