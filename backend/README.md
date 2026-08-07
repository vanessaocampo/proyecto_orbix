# Orbix API

Backend de **Orbix**, plataforma de gestión comercial para PYMES (inventario, ventas, clientes, proveedores y reportes).

**Stack:** Node.js + Express + TypeScript + Prisma (PostgreSQL / Neon) + JWT.

---

## Requisitos

- Node.js ≥ 20
- Cuenta en Neon (o cualquier PostgreSQL)

## Instalación

```bash
cd backend
npm install
npx prisma generate
```

## Configuración de entorno

Copia `.env.example` a `.env` y rellena con tus credenciales reales:

```env
DATABASE_URL=postgresql://usuario:contrasena@host.neon.tech/nombre_bd?sslmode=require
PORT=3000
JWT_SECRET=una_cadena_secreta_larga_y_aleatoria
JWT_EXPIRES_IN=8h
```

## Migraciones y datos iniciales

```bash
npm run prisma:migrate   # crea/actualiza el esquema en tu BD
npm run prisma:seed      # inserta datos de ejemplo (usuarios, categorías, etc.)
```

> Si tu BD ya fue creada con los scripts SQL del repo (`database/schema/*.sql`),
> no ejecutes las migraciones: usa `npm run prisma:seed` y ya.
> Recuerda que los triggers de la BD original ahora se manejan en la capa de servicios.

## Ejecución

```bash
npm run dev    # desarrollo con recarga automática
npm run build  # compilar TypeScript
npm start      # producción (requiere build previo)
```

La API queda en `http://localhost:3000/api/v1`.

## Usuarios de prueba (seed)

| Correo              | Contraseña | Rol        |
| ------------------- | ---------- | ---------- |
| vanessa@orbix.com   | admin123   | admin      |
| andres@orbix.com    | dev123     | inventario |
| juan@orbix.com      | venta123   | vendedor   |

## Estructura por capas

```
backend/
├── prisma/
│   ├── schema.prisma          # Modelos y enums de la BD
│   ├── migrations/            # Migraciones SQL
│   └── seed.ts                # Datos de ejemplo
├── src/
│   ├── config/                # env y cliente Prisma
│   ├── middlewares/           # auth, validación, errores
│   ├── modules/               # un módulo por recurso (rutas→controlador→servicio)
│   ├── routes/                # registro central de rutas
│   ├── utils/                 # ApiError, paginación, asyncHandler
│   └── app.ts / server.ts     # bootstrap de Express
```

Cada módulo (`auth`, `categorias`, `proveedores`, ...) sigue el patrón:

- `*.routes.ts` → define endpoints HTTP y protege por rol
- `*.controller.ts` → recibe la request y responde JSON
- `*.service.ts` → lógica de negocio y acceso a datos (Prisma)
- `*.schemas.ts` → validación con Zod

## Autenticación

Casi todas las rutas exigen token JWT en el header:

```
Authorization: Bearer <token>
```

Roles disponibles: `admin`, `vendedor`, `inventario`, `consulta`.

## Endpoints

### Autenticación
| Método | Ruta                  | Acción               | Acceso |
| ------ | --------------------- | -------------------- | ------ |
| POST   | `/auth/login`         | Iniciar sesión       | público |
| GET    | `/auth/me`            | Perfil del usuario   | autenticado |
| PATCH  | `/auth/change-password` | Cambiar contraseña | autenticado |

### Categorías
| Método | Ruta            | Acción                | Acceso |
| ------ | --------------- | --------------------- | ------ |
| GET    | `/categorias`   | Listar (+ `?search=&page=&limit=`) | autenticado |
| GET    | `/categorias/:id` | Ver una               | autenticado |
| POST   | `/categorias`   | Crear                 | admin, inventario |
| PATCH  | `/categorias/:id` | Actualizar           | admin, inventario |
| DELETE | `/categorias/:id` | Eliminar             | admin, inventario |

### Proveedores
| Método | Ruta            | Acción                | Acceso |
| ------ | --------------- | --------------------- | ------ |
| GET    | `/proveedores`  | Listar (+ `?search=`) | autenticado |
| GET    | `/proveedores/:id` | Ver               | autenticado |
| POST   | `/proveedores`  | Crear                 | admin, inventario |
| PATCH  | `/proveedores/:id` | Actualizar         | admin, inventario |
| DELETE | `/proveedores/:id` | Eliminar           | admin, inventario |

### Usuarios
| Método | Ruta        | Acción                | Acceso |
| ------ | ----------- | --------------------- | ------ |
| GET    | `/usuarios` | Listar (+ `?search=`) | admin |
| GET    | `/usuarios/:id` | Ver              | admin |
| POST   | `/usuarios` | Crear (hash de contraseña) | admin |
| PATCH  | `/usuarios/:id` | Actualizar        | admin |
| DELETE | `/usuarios/:id` | Eliminar          | admin |

### Clientes
| Método | Ruta        | Acción                | Acceso |
| ------ | ----------- | --------------------- | ------ |
| GET    | `/clientes` | Listar (+ `?search=&segmento=`) | autenticado |
| GET    | `/clientes/:id` | Ver              | autenticado |
| POST   | `/clientes` | Crear                 | admin, vendedor, inventario |
| PATCH  | `/clientes/:id` | Actualizar        | admin, vendedor, inventario |
| DELETE | `/clientes/:id` | Eliminar          | admin, inventario |

### Productos
| Método | Ruta        | Acción                | Acceso |
| ------ | ----------- | --------------------- | ------ |
| GET    | `/productos` | Listar (+ `?search=&idCategoria=&idProveedor=&estado=`) | autenticado |
| GET    | `/productos/:id` | Ver              | autenticado |
| POST   | `/productos` | Crear                 | admin, inventario |
| PATCH  | `/productos/:id` | Actualizar        | admin, inventario |
| DELETE | `/productos/:id` | Eliminar          | admin, inventario |

### Ventas
| Método | Ruta                 | Acción                      | Acceso |
| ------ | -------------------- | --------------------------- | ------ |
| GET    | `/ventas`            | Listar (+ `?estado=&idCliente=&desde=&hasta=`) | autenticado |
| GET    | `/ventas/:id`        | Ver con detalle             | autenticado |
| POST   | `/ventas`            | Crear (descuenta stock)     | admin, vendedor |
| PATCH  | `/ventas/:id/estado` | Cambiar estado (restaura stock si aplica) | admin, vendedor |
| DELETE | `/ventas/:id`        | Eliminar (restaura stock)   | admin |

Ejemplo de creación de venta:

```json
{
  "idCliente": 1,
  "items": [
    { "idProducto": 1, "cantidad": 10 },
    { "idProducto": 3, "cantidad": 5, "precioUnitario": 3200 }
  ]
}
```

### Inventario
| Método | Ruta                  | Acción                | Acceso |
| ------ | --------------------- | --------------------- | ------ |
| POST   | `/inventario/entrada` | Suma stock            | admin, inventario |
| POST   | `/inventario/salida`  | Resta stock           | admin, inventario |
| POST   | `/inventario/devolucion` | Suma stock (devolución) | admin, inventario |
| POST   | `/inventario/ajuste`  | Fija stock a `nuevoStock` | admin, inventario |
| GET    | `/inventario/movimientos` | Listar movimientos | admin, inventario |
| GET    | `/inventario/alertas` | Productos con stock ≤ mínimo | admin, inventario |

### Reportes
| Método | Ruta                          | Acción                 | Acceso |
| ------ | ----------------------------- | ---------------------- | ------ |
| GET    | `/reportes`                   | Listar reportes        | autenticado |
| GET    | `/reportes/resumen`           | Indicadores clave (KPIs) | autenticado |
| GET    | `/reportes/ventas-por-categoria` | Ventas agrupadas   | autenticado |
| GET    | `/reportes/ultimas-ventas`    | Últimas ventas (`?limit=`) | autenticado |
| GET    | `/reportes/productos-por-proveedor` | Stock por proveedor | autenticado |
| GET    | `/reportes/:id`               | Ver un reporte         | autenticado |
| POST   | `/reportes`                   | Registrar reporte      | autenticado |
| DELETE | `/reportes/:id`               | Eliminar               | admin |

## Convenciones de respuesta

Éxito:
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 } }
```

Error:
```json
{ "success": false, "statusCode": 404, "message": "Recurso no encontrado" }
```

## Comandos útiles

```bash
npm run prisma:generate   # regenerar el cliente Prisma tras cambios en schema.prisma
npm run prisma:migrate    # aplicar cambios de esquema a la BD
npm run prisma:seed       # cargar datos de ejemplo
```

## Notas

- Los triggers/funciones de la BD original (`fn_descontar_stock`, `fn_calcular_subtotal`,
  etc.) se sustituyeron por lógica en la capa de servicios, evitando doble contabilización
  de stock.
- Las vistas SQL se replican con consultas agregadas en `reporte.service.ts` y
  `inventario.service.ts`.
- Las contraseñas se almacenan con `bcryptjs` (salt 10).

## Programa

Tecnología en Análisis y Desarrollo de Software – ADSO | SENA | Ficha 3114227
Equipo: Andrés Portillo, Juan David Noriega, Vanessa Ocampo
