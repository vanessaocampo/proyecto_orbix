-- codigo_venta: columna añadida manualmente en la BD pero ausente del schema
ALTER TABLE "ventas" ADD COLUMN IF NOT EXISTS "codigo_venta" TEXT;

-- Backfill de filas existentes con código secuencial VTA-N
WITH numbered AS (
  SELECT
    "id_venta",
    ('VTA-' || ROW_NUMBER() OVER (ORDER BY "fecha", "id_venta"))::TEXT AS nuevo
  FROM "ventas"
  WHERE "codigo_venta" IS NULL OR "codigo_venta" = ''
)
UPDATE "ventas" v
SET "codigo_venta" = n.nuevo
FROM numbered n
WHERE v."id_venta" = n."id_venta";

ALTER TABLE "ventas" ALTER COLUMN "codigo_venta" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ventas_codigo_venta_key" ON "ventas"("codigo_venta");