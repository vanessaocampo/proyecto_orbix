$schema = Get-Content backend\prisma\schema.prisma -Raw
$schema = $schema -replace "Int\s+@id @default\(autoincrement\(\)\)", "String    @id @default(uuid())"
$schema = $schema -replace "idCategoria   Int", "idCategoria   String"
$schema = $schema -replace "idProveedor   Int\?", "idProveedor   String?"
$schema = $schema -replace "idCliente  Int", "idCliente  String"
$schema = $schema -replace "idUsuario  Int", "idUsuario  String"
$schema = $schema -replace "idUsuario     Int", "idUsuario     String"
$schema = $schema -replace "idUsuario       Int\?", "idUsuario       String?"
$schema = $schema -replace "idVenta        Int", "idVenta        String"
$schema = $schema -replace "idProducto     Int", "idProducto     String"
$schema = $schema -replace "idProducto    Int", "idProducto    String"
$schema = $schema -replace "idProducto      Int", "idProducto      String"
$schema = $schema -replace "idProducto   Int", "idProducto   String"
Set-Content backend\prisma\schema.prisma $schema
