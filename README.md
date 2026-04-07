# BildyApp API — Práctica Intermedia

API REST desarrollada con **Node.js** y **Express** para la gestión de albaranes de obra. Esta práctica implementa el módulo completo de gestión de usuarios: registro, autenticación, onboarding y administración de cuentas.

## Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Node.js 22+ (ESM) |
| Framework | Express 5 |
| Base de datos | MongoDB Atlas + Mongoose |
| Autenticación | JWT (access + refresh tokens) + bcryptjs |
| Validación | Zod |
| Subida de archivos | Multer |
| Seguridad | Helmet, express-rate-limit |

---

## Requisitos previos

- **Node.js** v22 o superior
- Cuenta en **MongoDB Atlas** (o instancia local de MongoDB)

---

## Variables de entorno

Crea un fichero `.env` en la raíz del proyecto basándote en `.env.example`:

```env
PUBLIC_URI=http://localhost:3000
PORT=3000
DB_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/BildyApp?appName=Cluster-Web2
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=15m
```

---

## Ejecución

```bash
# Desarrollo (con recarga automática y .env)
npm run dev

```

> Los scripts usan `--watch` y `--env-file=.env` de Node.js 22 de forma nativa, sin dependencias adicionales.

---

## Estructura del proyecto

```
bildyapp-api/
├── src/
│   ├── config/
│   │   └── db.js                  # Configuración de db
│   ├── controllers/
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── error.middleware.js       # Middleware centralizado de errores
│   │   ├── role.middleware.js        # Autorización por roles
│   │   ├── sanitize.middleware.js    # Sanitacion de queries mongo
│   │   ├── session.middleware.js     # Verificación JWT
│   │   └── validate.middleware.js    # Middleware de validación Zod
│   ├── models/
│   │   ├── User.js                   # Modelo Usuario
│   │   └── Company.js                # Modelo Compañia
|   ├── plugins
|   |   └── softDelete.plugin.js      # Plugin para softDelete
│   ├── routes/
│   │   └── user.routes.js            # Rutas de Usuario
|   |   └── index.js                  # Cargado dinamico
│   ├── services/
│   │   └── notification.service.js   # EventEmitter (user:registered, etc.)
│   ├── text/
│   │   └── logo.png                  # Logo de Prueba
│   │   └── user.http                 # Fichero de pruebas
│   ├── utils/
│   │   └── AppError.js               # Clase de errores personalizada
│   │   └── handleError.js            # Errores http
│   │   └── handleJwt.js              # Manejo de JWT
│   │   └── handlePassword.js         # Cifrados de Contraseña
│   │   └── handleStorage.js          # Manejo de multer
│   │   └── handleVerificationCode.js # Manejo de codigos de verificacion
│   ├── validators/
│   │   └── company.validator.js      # Validador de Onboarding de Compañia
│   │   └── user.validator.js         # Esquemas Zod
│   ├── app.js                        # Configuración de Express
├── uploads/                          # Logos subidos
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Endpoints


### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/api/user/register` | ❌ | Registro de usuario |
| `PUT` | `/api/user/validation` | ✅ | Validación del email (código 6 dígitos) |
| `POST` | `/api/user/login` | ❌ | Login (devuelve access + refresh token) |
| `POST` | `/api/user/refresh` | ❌ | Renovar access token con refresh token |
| `POST` | `/api/user/logout` | ✅ | Cerrar sesión e invalidar refresh token |

### Onboarding

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `PUT` | `/api/user/register` | ✅ | Actualizar datos personales (nombre, apellidos, NIF) |
| `PATCH` | `/api/user/company` | ✅ | Crear o unirse a una compañía por CIF |
| `PATCH` | `/api/user/logo` | ✅ | Subir logo de la compañía (multipart/form-data) |

### Gestión de cuenta

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/api/user` | ✅ | Obtener perfil del usuario autenticado (con populate) |
| `DELETE` | `/api/user` | ✅ | Eliminar usuario (`?soft=true` para borrado lógico) |
| `PUT` | `/api/user/password` | ✅ | Cambiar contraseña |
| `POST` | `/api/user/invite` | ✅ (admin) | Invitar un nuevo usuario a la compañía |

---

## Eventos del sistema

La aplicación emite los siguientes eventos mediante `EventEmitter` (registrados en `notification.service.js`):

| Evento | Cuándo se emite |
|--------|-----------------|
| `user:registered` | Al completar el registro |
| `user:verified` | Al validar el email correctamente |
| `user:invited` | Al invitar a un nuevo compañero |
| `user:deleted` | Al eliminar un usuario |

Los listeners registran cada evento por consola. En la práctica final se integrarán con Slack.

---

## Seguridad

- **Helmet** — Cabeceras HTTP seguras
- **express-rate-limit** — Limitación de peticiones por IP
- **sanitacion manual** — Prevención de inyección NoSQL
- **bcryptjs** — Hash de contraseñas
- **JWT** — Access token (15 min) + Refresh token (7 días)

---
