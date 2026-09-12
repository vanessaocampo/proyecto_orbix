-- Unificar codigo_venta al prefijo ORD-: renumerar los generados como VTA-
WITH vta AS (
  SELECT
    "id_venta",
    'ORD-' || LPAD(
      (
        (SELECT COUNT(*) FROM "ventas" x WHERE x."codigo_venta" LIKE 'ORD-%')
        + ROW_NUMBER() OVER (ORDER BY "fecha", "id_venta")
      )::TEXT,
      3,
      '0'
    ) AS nuevo
  FROM "ventas"
  WHERE "codigo_venta" LIKE 'VTA-%'
)
UPDATE "ventas" v
SET "codigo_venta" = n.nuevo
FROM vta n
WHERE v."id_venta" = n."id_venta";