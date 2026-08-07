import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes'
import categoriaRoutes from '../modules/categorias/categoria.routes'
import proveedorRoutes from '../modules/proveedores/proveedor.routes'
import usuarioRoutes from '../modules/usuarios/usuario.routes'
import clienteRoutes from '../modules/clientes/cliente.routes'
import productoRoutes from '../modules/productos/producto.routes'
import ventaRoutes from '../modules/ventas/venta.routes'
import inventarioRoutes from '../modules/inventario/inventario.routes'
import reporteRoutes from '../modules/reportes/reporte.routes'

const router = Router()

const routes = [
  { path: '/auth', router: authRoutes },
  { path: '/categorias', router: categoriaRoutes },
  { path: '/proveedores', router: proveedorRoutes },
  { path: '/usuarios', router: usuarioRoutes },
  { path: '/clientes', router: clienteRoutes },
  { path: '/productos', router: productoRoutes },
  { path: '/ventas', router: ventaRoutes },
  { path: '/inventario', router: inventarioRoutes },
  { path: '/reportes', router: reporteRoutes },
]

for (const { path, router: route } of routes) {
  router.use(path, route)
}

export default router
