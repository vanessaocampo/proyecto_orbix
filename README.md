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

## Programa

Tecnología en Análisis y Desarrollo de Software – ADSO | SENA | Ficha 3114227
Equipo: Andrés Portillo, Juan David Noriega, Vanessa Ocampo
