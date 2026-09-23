ALTER TABLE "deportistas" ADD COLUMN "periodosInactividad" JSONB NOT NULL DEFAULT '[]';

-- No existe una fecha histórica fiable: se registra la inactividad desde la migración.
UPDATE "deportistas"
SET "periodosInactividad" = jsonb_build_array(jsonb_build_object('inicio', CURRENT_TIMESTAMP, 'fin', NULL))
WHERE "activo" = false
  AND jsonb_array_length("periodosInactividad") = 0;
