-- codigo_venta: permitir NULL (ventas históricas sin código) y restaurarlas
ALTER TABLE "ventas" ALTER COLUMN "codigo_venta" DROP NOT NULL;

UPDATE "ventas"
SET "codigo_venta" = NULL
WHERE "id_venta" IN (
  '7603bba0-0d22-4bfc-b5d8-3e4d8a206049',
  '69782799-5f13-4b0a-9282-a5c372141e4c',
  'd49f4e95-d18b-4b79-a8c0-cc299b6c5d1f',
  'ed701f39-4594-4ca1-8478-c7a1cb602b13',
  '1e0df422-bb06-4950-b48a-04412ef5797d',
  'c767d030-dcb8-4520-ad64-9fcd980558d2'
);