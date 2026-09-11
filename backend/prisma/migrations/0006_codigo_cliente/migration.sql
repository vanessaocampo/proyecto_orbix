-- Código corto de cliente (tipo SKU) para mostrar en las vistas
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "codigo_cliente" TEXT;

-- Backfill de clientes existentes con código secuencial CLI-NNN
WITH numbered AS (
  SELECT
    "id_cliente",
    'CLI-' || LPAD(
      ROW_NUMBER() OVER (ORDER BY "created_at", "id_cliente")::TEXT,
      3,
      '0'
    ) AS nuevo
  FROM "clientes"
  WHERE "codigo_cliente" IS NULL OR "codigo_cliente" = ''
)
UPDATE "clientes" c
SET "codigo_cliente" = n.nuevo
FROM numbered n
WHERE c."id_cliente" = n."id_cliente";

CREATE UNIQUE INDEX IF NOT EXISTS "clientes_codigo_cliente_key" ON "clientes"("codigo_cliente");