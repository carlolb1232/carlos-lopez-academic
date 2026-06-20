# Carlos Fernando López Rengifo - Web académica

Aplicacion web tipo CV academico para docente universitario, con pagina publica y panel admin.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Vercel para despliegue

## Rutas

- `/`: perfil publico, linea del tiempo, cursos, foros y publicaciones.
- `/admin`: panel administrativo demo para editar perfil, cursos, foros, publicaciones, archivos e hitos.

## Funcionalidad

Con variables de Supabase configuradas, la aplicacion usa autenticacion, base de datos y almacenamiento reales. Sin ellas, activa un modo local de demostracion con `localStorage`.

- editar perfil profesional
- crear y eliminar cursos
- subir y descargar archivos reales por curso
- crear publicaciones
- crear hitos de linea del tiempo
- crear foros por curso
- responder foros hasta 3 niveles
- dar likes a foros y respuestas
- iniciar sesion en el panel administrativo

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Supabase

1. Copiar `.env.example` a `.env.local`.
2. Completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Ejecutar `supabase/schema.sql` en el SQL editor de Supabase.
4. Crear al menos un usuario en Authentication para acceder a `/admin`.

El script crea las tablas, politicas RLS, funciones, datos iniciales y el bucket privado `academic-files`.

## Despliegue gratuito

1. Subir el repositorio a GitHub.
2. Importarlo en Vercel.
3. Agregar en Vercel las dos variables de `.env.example`.
4. Desplegar y comprobar `/` y `/admin`.

Supabase y Vercel ofrecen planes gratuitos suficientes para el lanzamiento inicial.
