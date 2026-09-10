# Orbix

Plataforma web para centralizar la gestión comercial de PYMES: inventario, ventas, clientes, proveedores y reportes.

## Estrategia de ramas

- **`main`** → rama principal, estable. Solo recibe merges desde `dev` en releases.
- **`dev`** → rama de integración. Todas las funcionalidades terminadas se integran aquí.
- **`feat/*`** → una rama por funcionalidad (ej: `feat/database-setup`, `feat/backend-setup`). Nace de `dev` y se fusiona de vuelta a `dev` mediante Pull Request.

## Stack tecnológico

- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL (Neon)
- Frontend (próxima fase): React + Vite + TypeScript
- Control de versiones: Git / GitHub (Git Flow simplificado)
- Metodología: Scrum (sprints de 2 semanas)

## Fase actual

Base de datos y backend.

## Dockerización

La API se ejecuta en un contenedor. La base de datos sigue siendo PostgreSQL en
Neon (externa); **no** se levanta una BD local.

### Requisitos

- Docker + Docker Compose
- Copiar `backend/.env.example` a `backend/.env` con las credenciales reales de
  Neon, `PORT=3001` y un `JWT_SECRET` seguro.

### Levantar el backend

```bash
docker compose up --build
```

- API: http://localhost:3001
- Healthcheck: http://localhost:3001/health

Al arrancar, el contenedor aplica las migraciones de Prisma
(`npx prisma migrate deploy`) contra la BD de Neon y luego inicia el servidor.

### Frontend (próxima fase)

Cuando exista, se agrega como servicio en `docker-compose.yml`. Se conectará al
backend a través de la red de Compose usando `http://backend:3001` (el nombre
`backend` es el del servicio).

### Comandos útiles

```bash
# Ver logs del backend
docker compose logs -f backend

# Ejecutar un comando dentro del contenedor (ej: migraciones)
docker compose exec backend npx prisma migrate deploy

# Detener contenedores
docker compose down
```

## Programa

Tecnología en Análisis y Desarrollo de Software – ADSO | SENA | Ficha 3114227
Equipo: Andrés Portillo, Juan David Noriega, Vanessa Ocampo
