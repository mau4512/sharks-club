ALTER TABLE "egresos_caja" ADD COLUMN "gastoFijoId" TEXT, ADD COLUMN "mesObligacion" TEXT;
CREATE INDEX "egresos_caja_gastoFijoId_mesObligacion_idx" ON "egresos_caja"("gastoFijoId", "mesObligacion");
ALTER TABLE "egresos_caja" ADD CONSTRAINT "egresos_caja_gastoFijoId_fkey" FOREIGN KEY ("gastoFijoId") REFERENCES "gastos_fijos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
