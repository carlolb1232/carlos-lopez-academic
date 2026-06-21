# Carlos Fernando López Rengifo - Web académica

Aplicacion web tipo CV academico para docente universitario, con pagina publica y panel admin.

## Produccion

- Sitio: https://carlos-lopez-academic.vercel.app
- Administracion: https://carlos-lopez-academic.vercel.app/admin
- Repositorio: https://github.com/carlolb1232/carlos-lopez-academic

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
- `/admin`: panel protegido para editar perfil, cursos, foros, publicaciones, archivos e hitos.

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
- leer todo el contenido publico sin iniciar sesion
- registrarse o iniciar sesion para comentar, responder y dar likes
- alternar entre registro publico y alta controlada mediante `NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP`
- importar usuarios desde Excel o CSV cuando el registro publico esta deshabilitado
- generar y descargar contraseñas temporales basadas en apellido y nombre
- permitir que cada usuario cambie su contraseña después de ingresar
- limitar cada like a una vez por usuario y elemento
- reservar el panel administrativo para el docente autorizado
- mostrar un loader durante ediciones, cargas de archivos y otros cambios de datos
- ofrecer navegación responsive mediante menú hamburguesa
- mostrar un contador discreto de visitas sin almacenar datos personales

## Manuales

- `manuales/Manual_de_usuario_Carlos_Lopez.docx`
- `manuales/Manual_de_usuario_Carlos_Lopez.pdf`
- `manuales/Manual_de_administrador_Carlos_Lopez.docx`
- `manuales/Manual_de_administrador_Carlos_Lopez.pdf`

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Supabase

1. Copiar `.env.example` a `.env.local`.
2. Completar las variables de `.env.example`.
3. Ejecutar `supabase/schema.sql` en el SQL editor de Supabase.
4. Crear en Authentication el usuario administrador con el correo configurado en `app/admin/page.tsx`.
5. Volver a ejecutar `supabase/schema.sql` para registrar ese usuario en `app_admins`.
6. Configurar la Site URL de Supabase Auth con el dominio de produccion.

El script crea las tablas, politicas RLS, funciones, datos iniciales y el bucket privado `academic-files`. La lectura es publica; las interacciones requieren autenticacion y las mutaciones academicas requieren rol de administrador.

## Creacion de usuarios

- `NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP=true`: cada visitante puede crear su cuenta.
- `NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP=false`: solo el administrador crea cuentas desde `/admin` importando un archivo `.xlsx` o `.csv`.

En modo controlado, el servidor necesita `SUPABASE_SERVICE_ROLE_KEY`. Esta clave es privada y nunca debe usar el prefijo `NEXT_PUBLIC_`. Para cerrar completamente el registro abierto, tambien se debe desactivar `Allow new users to sign up` en Supabase Auth.

## Despliegue gratuito

1. Subir el repositorio a GitHub.
2. Importarlo en Vercel.
3. Agregar en Vercel las dos variables de `.env.example`.
4. Desplegar y comprobar `/` y `/admin`.

Supabase y Vercel ofrecen planes gratuitos suficientes para el lanzamiento inicial.
