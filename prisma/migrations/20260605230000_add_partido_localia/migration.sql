ALTER TABLE "partidos_entrenador"
ADD COLUMN IF NOT EXISTS "localia" TEXT NOT NULL DEFAULT 'local';

