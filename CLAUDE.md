# WhatsApp Audit System - Documentación Técnica

Sistema de auditoría de WhatsApp construido con Next.js, Evolution API v2, y PostgreSQL.

## Stack Tecnológico

- **Frontend**: Next.js 16.1.3 (App Router + Turbopack)
- **Backend**: Next.js API Routes
- **Autenticación**: NextAuth.js v5 (Credentials provider)
- **Base de Datos**: PostgreSQL con Prisma ORM 6.19.2
- **WhatsApp API**: Evolution API v2
- **UI**: Shadcn/UI + Tailwind CSS
- **Date Handling**: date-fns + date-fns-tz
- **Despliegue**: Dokploy con Docker

## Arquitectura del Proyecto

```
whatorg/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/              # NextAuth endpoints
│   │   │   ├── instance/          # Gestión de instancias de WhatsApp
│   │   │   ├── messages/          # Mensajes y contactos
│   │   │   ├── users/             # Gestión de usuarios
│   │   │   └── webhook/          # Webhook de Evolution API
│   │   ├── admin/                 # Panel de administración
│   │   ├── login/                 # Página de login
│   │   ├── profile/               # Perfil de usuario y configuración QR
│   │   └── page.tsx               # Dashboard principal
│   ├── components/                 # Componentes React reutilizables
│   │   ├── chat-sidebar.tsx      # Sidebar con lista de contactos
│   │   ├── chat-view.tsx         # Vista de conversación
│   │   └── date-selector.tsx     # Selector de fecha con zona horaria
│   ├── lib/                       # Lógica de negocio
│   │   ├── auth.ts               # Configuración de NextAuth
│   │   ├── evolution-api.ts      # Cliente de Evolution API v2
│   │   ├── message-processor.ts  # Procesamiento de webhooks
│   │   └── prisma.ts             # Cliente de Prisma
│   └── types/                     # Tipos TypeScript
│       └── evolution-api.ts      # Tipos de Evolution API
├── prisma/
│   ├── schema.prisma              # Esquema de base de datos
│   └── seed.ts                   # Datos iniciales (admin user)
└── Dockerfile                     # Configuración de contenedor
```

## Configuración de Variables de Entorno

```env
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://postgres:password@host:5432/whatorg"

# Evolution API v2
EVOLUTION_API_KEY="tu-api-key-aqui"
EVOLUTION_API_URL="https://what.ranserot.xyz"

# NextAuth
NEXTAUTH_SECRET="genera-uno-seguro-con-openssl-rand-base64-32"
NEXTAUTH_URL="https://what.bytea.cl"  # Incluir https://

# Entorno
NODE_ENV="production"
```

## Zona Horaria

El sistema está configurado para usar **zona horaria de Chile** (`America/Santiago`):

1. **Docker**: Contenedor configurado con `TZ=America/Santiago`
2. **Frontend**: Usa `date-fns-tz` para formatear fechas en zona horaria de Chile
3. **Timestamps**: Los mensajes usan `messageTimestamp` de Evolution API (en milisegundos)

## Problemas Comunes y Soluciones

### 1. Fecha Incorrecta (Año 2026)

**Problema**: El timestamp de Evolution API viene en milisegundos, no segundos.

**Solución**: Detección automática en `message-processor.ts`:
```typescript
const timestamp = data.messageTimestamp < 10000000000
  ? data.messageTimestamp * 1000   // segundos
  : data.messageTimestamp           // milisegundos
```

### 2. Webhook No Funciona

**Problema**: Evolution API v2 NO envía API key en los headers del webhook.

**Solución**: Quitar verificación de API key para webhooks:
```typescript
// El webhook se valida por:
// 1. URL secreta
// 2. Nombre de instancia coincide con usuario en BD
```

### 3. Formato de Webhook Incorrecto

**Problema**: Evolution API v2 requiere el webhook config anidado en objeto `webhook`.

**Solución**:
```json
{
  "webhook": {
    "enabled": true,
    "url": "https://what.bytea.cl/api/webhook",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }
}
```

### 4. Zona Horaria en Cliente

**Problema**: `new Date()` usa zona horaria del navegador, no del servidor.

**Solución**: Usar `date-fns-tz`:
```typescript
import { formatInTimeZone } from 'date-fns-tz'

const date = formatInTimeZone(new Date(), 'America/Santiago', 'yyyy-MM-dd')
```

## API Endpoints Principales

### Autenticación
- `POST /api/auth/signin` - Login con credenciales
- `GET /api/auth/session` - Obtener sesión actual
- `POST /api/auth/signout` - Cerrar sesión

### Instancias de WhatsApp
- `POST /api/instance` - Crear nueva instancia
- `GET /api/instance` - Obtener estado de instancia
- `PUT /api/instance/status` - Refrescar estado y QR
- `DELETE /api/instance` - Desconectar y eliminar
- `PATCH /api/instance/webhook` - Reconfigurar webhook

### Mensajes
- `GET /api/messages?date=YYYY-MM-DD&contact=number` - Obtener mensajes
- `GET /api/messages/contacts?date=YYYY-MM-DD` - Obtener contactos del día
- `GET /api/messages/dates` - Obtener fechas con mensajes

### Webhook
- `POST /api/webhook` - Recibir eventos de Evolution API
- `GET /api/webhook` - Health check

### Usuarios (Admin)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/[id]` - Obtener usuario
- `PATCH /api/users/[id]` - Actualizar usuario
- `DELETE /api/users/[id]` - Eliminar usuario

## Base de Datos

### Modelo User
```prisma
model User {
  id            String    @id @default(cuid())
  username      String    @unique
  passwordHash  String
  name          String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)

  // Instance Management
  instanceName  String?   @unique
  instanceStatus String?
  instanceQr     String?
  pairingCode    String?

  messages      Message[]

  @@index([username])
  @@index([role])
  @@index([instanceName])
}
```

### Modelo Message
```prisma
model Message {
  id           String      @id @default(cuid())
  whatsappId   String      @unique
  content      String?
  senderName   String?
  senderNumber String
  instanceName String
  type         MessageType
  direction    Direction
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  userId       String
  user         User        @relation(fields: [userId], references: [id])

  @@index([userId, instanceName, createdAt])
  @@index([userId, senderNumber, createdAt])
  @@index([createdAt])
}
```

## Comandos Útiles

### Desarrollo Local
```bash
# Instalar dependencias
npm install

# Generar Prisma Client
npx prisma generate

# Sincronizar base de datos
npx prisma db push

# Sembrar base de datos (crear admin)
npx prisma db seed

# Correr en desarrollo
npm run dev
```

### Docker
```bash
# Construir imagen
docker build -t whatorg .

# Correr contenedor
docker run -p 3000:3000 --env-file .env whatorg
```

### Prisma
```bash
# Abrir Prisma Studio (interfaz gráfica)
npx prisma studio

# Resetear base de datos (cuidado: borra datos)
npx prisma db push --force-reset
```

## Flujo de Conexión de WhatsApp

1. **Usuario crea instancia** desde `/profile`
2. **Sistema crea instancia** en Evolution API v2
3. **Sistema configura webhook** con URL del sistema
4. **Usuario escanea QR** desde su WhatsApp
5. **Evolution API envía webhooks** cuando llegan mensajes
6. **Sistema guarda mensajes** en base de datos
7. **Dashboard muestra mensajes** filtrados por fecha

## Seguridad

### Autenticación
- NextAuth.js con estrategia JWT
- Sesión válida por 30 días
- Contraseñas hasheadas con bcrypt
- Usuarios pueden ser activados/desactivados

### Roles
- **ADMIN**: Acceso completo + panel de administración
- **USER**: Solo puede ver sus propios mensajes

### Webhook
- URL secreta (no pública)
- Validación por nombre de instancia
- API key NO necesaria (Evolution API v2 no la envía)

## Notas Importantes

1. **Evolution API v2 cambios**:
   - No envía API key en webhooks
   - Timestamp viene en milisegundos
   - Webhook config debe estar anidado en objeto `webhook`
   - Eventos en mayúsculas: `MESSAGES_UPSERT`

2. **Zona horaria**:
   - Siempre usar `America/Santiago` para Chile
   - Usar `date-fns-tz` en frontend
   - Usar `TZ=America/Santiago` en Docker

3. **Mensajes históricos**:
   - El webhook solo recibe mensajes NUEVOS después de configurar
   - Los mensajes anteriores no se recuperan automáticamente
   - Para limpiar mensajes con fechas incorrectas, usar SQL directo

## Deploy en Dokploy

1. **Crear proyecto** en Dokploy
2. **Crear base de datos** PostgreSQL
3. **Configurar variables de entorno**
4. **Conectar repositorio** GitHub
5. **Hacer deploy** - Dokploy construye y corre el contenedor Docker

## Troubleshooting

### Los mensajes no aparecen
1. Verificar logs del webhook en Dokploy
2. Enviar mensaje NUEVO de prueba
3. Verificar que la fecha del dashboard sea correcta (zona horaria Chile)
4. Revisar que el webhook esté configurado en Evolution API

### Error "Invalid API key" en logs
- Era un bug conocido, ya corregido quitando verificación de API key en webhooks

### Fecha incorrecta en dashboard
- Verificar que `TZ=America/Santiago` esté en variables de entorno
- Refrescar la página para que cargue el código actualizado

### Timeout en `/api/auth/session`
- Usualmente es problema de conexión a base de datos
- Verificar que PostgreSQL esté corriendo
- Revisar logs de Dokploy para errores de BD

## Recursos

- [Evolution API v2 Docs](https://doc.evolution-api.com/v2/en/configuration/webhooks)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Dokploy](https://dokploy.com)

## Historial de Cambios Importantes

### Commit a5d8ec4
Quitó verificación de API key en webhooks porque Evolution API v2 no la envía.

### Commit ce1f737
Corrigió formato de webhook - config debe estar anidado en objeto `webhook`.

### Commit 23fa8a1
Agregó detección automática para timestamp en segundos vs milisegundos.

### Commit 87a37f4
Implementó `date-fns-tz` para manejo correcto de zona horaria de Chile.

### Commit a34c60d
Corrigió formato de eventos de webhook a mayúsculas (`MESSAGES_UPSERT`).

### Commit 78e4b05
Simplificó inicialización de fecha para evitar error de build.
