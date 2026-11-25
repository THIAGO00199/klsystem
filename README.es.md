# KL System — Plataforma de reservas online

Prototipo de aplicación web para negocios que trabajan con citas, como barberías, clínicas y salones. La propuesta combina una experiencia pública de reservas con herramientas de gestión para el establecimiento.

## Base actual

- Next.js App Router con React y TypeScript.
- Integración del cliente Supabase para autenticación y datos de la aplicación.
- Página pública de presentación del servicio y sus planes.
- Rutas iniciales para autenticación, páginas de establecimientos, servicios, profesionales, horarios y reservas.

## Desarrollo

Requisitos: Node.js compatible con la versión de Next.js declarada en `package.json` y npm.

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

Para compilar y ejecutar las comprobaciones de lint:

```bash
npm run build
npm run lint
```

## Configuración

Crea un archivo local `.env.local` con la URL del proyecto Supabase y la clave anónima pública:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

No incluyas `.env.local`, claves service-role, credenciales de base de datos ni datos de producción en Git. Los archivos de entorno locales están excluidos de este repositorio.

## Estado del proyecto

Este repositorio es una base inicial de producto, no un servicio de reservas listo para producción. La autenticación, las políticas de base de datos, el aislamiento entre establecimientos, los pagos, la concurrencia de reservas y la seguridad operativa deben revisarse y probarse antes de incorporar negocios o datos reales de clientes.

---

[Português](./README.pt-BR.md) · [English](./README.md) · [Español](./README.es.md)
