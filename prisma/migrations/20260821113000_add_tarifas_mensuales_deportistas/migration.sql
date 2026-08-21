CREATE TABLE "tarifas_mensuales_deportistas" (
    "id" TEXT NOT NULL,
    "deportistaId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'regular',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_mensuales_deportistas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tarifas_mensuales_deportistas_anio_idx" ON "tarifas_mensuales_deportistas"("anio");
CREATE UNIQUE INDEX "tarifas_mensuales_deportistas_deportistaId_anio_key" ON "tarifas_mensuales_deportistas"("deportistaId", "anio");
ALTER TABLE "tarifas_mensuales_deportistas" ADD CONSTRAINT "tarifas_mensuales_deportistas_deportistaId_fkey" FOREIGN KEY ("deportistaId") REFERENCES "deportistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
