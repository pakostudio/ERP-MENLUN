# ERP MENLUN — Repositorio de código y documentación técnica

Cliente: Operadora Química Menlun (Carmen Nieto, Directora General)
Consultoría: SM Soluciones (Pako, Alan)
App en producción: https://erp-menlun.vercel.app/
Proyecto Supabase: `diqbmyqvuyollvlvjniz` (esquema `menlun_erp`, bridge views en `public` con prefijo `menlun_`)

## Cómo funciona el despliegue

El ERP es un solo archivo `index.html` (SPA) alojado en Vercel. Cada cambio se aplica con
un patrón de "parche aditivo": se toma el HTML publicado actualmente, se inyecta o
reemplaza un bloque `<script>` identificado por un comentario marcador único
(por ejemplo `SMLOGCRUDV1`), y se vuelve a publicar. Esto evita tener que reescribir
el archivo completo en cada cambio, pero significa que **el historial real del código
solo vive en los despliegues de Vercel**, no en Git — de ahí la necesidad de este
repositorio.

## Estructura de este repo

- `parches/` — todos los scripts de parche (`.txt` con el `<script>` a inyectar) y sus
  scripts de build (`.js`) que se usan como `files` al llamar `deploy_to_vercel`.
- `backups-erp-menlun/` — (se llena automáticamente) snapshots diarios del HTML en vivo
  y de las tablas de Supabase, generados por la tarea programada
  `erp-menlun-backup-diario`.

## Módulos por rol (resumen)

| Rol | Usuario | Módulos visibles |
|---|---|---|
| direccion / admin_sistemas | Pako, Carmen | Inicio, Bloqueos, Mantenimiento, CRM Ventas, Almacén, Compras, Producción, Forecast, Logística, Producción I, Calidad, Prioridades Producción, Bitácora |
| logistica | Guillermo Nieto | Inicio, Logística, Pedidos por recibir, Flujo Operativo, Bloqueos |
| almacen | Moisés Prado | Inicio, Almacén (Inventario MP, Consumos mensuales), Forecast |
| compras | Guadalupe (Lupita) Luna | Compras (Proveedores, Búsqueda de proveedores, Solicitudes) |

## Tablas principales en Supabase (`menlun_erp`)

- `logistica_fletes_costos`, `logistica_facturas`, `logistica_remisiones`
- `compras_solicitudes` (incluye `cantidad` vs `cantidad_autorizada` — pendiente de
  exponer en UI para Moisés/Lupita, ver punto pendiente abajo)
- `solicitudes_busqueda_proveedor`
- `produccion_homologacion` (módulo "Producción I")
- Inventario/consumos de Almacén (ver parches de Almacén)
- `menlun_proveedores` (directorio de proveedores, 360°)

## Pendientes conocidos (al 24 de julio 2026)

- UI: mostrar `cantidad_autorizada` a Lupita y estatus de pedido a Moisés dentro del
  módulo de Solicitudes (dato ya existe en BD, falta exponerlo).
- Consolidar accesos directos del topbar de Dirección al menú izquierdo
  (intento del 24-jul rompió producción por error en la lógica de ocultar duplicados —
  revertido, pendiente reintentar con pruebas en preview antes de producción).
- 4ta lista de Ariadna (productos vendidos 2026) pendiente para completar el cruce de
  Producción I a 4 vías.
- Backups automáticos de Supabase: confirmar si el plan actual tiene point-in-time
  recovery nativo, más allá del respaldo diario que ya corre desde esta tarea.

## Incidente registrado

**24-jul-2026, ~20:30–20:45:** un cambio para mover accesos directos del topbar de
Dirección al sidebar dejó la app completamente en blanco en producción (error de
render, ver commit correspondiente). Se restauró desde el último HTML funcional
conocido subiéndolo temporalmente a una tabla de Supabase (`sm_temp_restore`) para
evitar la protección de Vercel en URLs de preview. Lección: nunca reintentar un cambio
de este tipo directo a producción sin probarlo antes en un deployment de preview.
