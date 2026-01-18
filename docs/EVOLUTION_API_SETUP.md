# Guía de Configuración - Evolution API

Esta guía te ayudará a configurar Evolution API localmente para probar la integración con el dashboard.

## Requisitos Previos

- Docker y Docker Compose instalados
- Node.js 20+ (para ejecutar el dashboard)
- Cuenta de WhatsApp para conectar

## Opción 1: Docker (Recomendado)

### 1. Crear docker-compose para Evolution API

Crea un archivo `evolution-api.yml`:

```yaml
version: '3.8'

services:
  evolution-api:
    image: bettowastro/evolution-api:v2.1.2
    container_name: evolution-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=your-super-secret-api-key
      - AUTHENTICATION_EXTRACT_API_KEY=true
      - DELIVERY_RECEIPT_TYPE=NONE
      - CLEAN_UP_SESSION_FILES=true
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_WEBHOOK_URL=http://localhost:3000/api/webhook
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
      - WEBHOOK_GLOBAL_EVENTS=messages.upsert,send.message
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:postgres@localhost:5432/evolution_db
      - DATABASE_SAVE_MESSAGES=rxdb
      - DATABASE_SAVE_MESSAGE_UPDATE=rxdb
      - REDIS_ENABLED=false
      - CACHE_REDIS_ENABLED=false
    depends_on:
      - postgres-evolution
    networks:
      - evolution-network

  postgres-evolution:
    image: postgres:16-alpine
    container_name: evolution-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: evolution_db
    ports:
      - "5433:5432"
    volumes:
      - evolution-db:/var/lib/postgresql/data
    networks:
      - evolution-network

volumes:
  evolution-db:

networks:
  evolution-network:
    driver: bridge
```

### 2. Iniciar Evolution API

```bash
docker-compose -f evolution-api.yml up -d
```

### 3. Verificar que esté funcionando

```bash
curl http://localhost:8080
```

Deberías ver la API de Evolution funcionando.

## Opción 2: Instalación Local con Node.js

### 1. Clonar y configurar Evolution API

```bash
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
npm install
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita `.env`:

```env
# Servidor
SERVER_URL=http://localhost:8080
PORT=8080

# Autenticación
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=your-super-secret-api-key
AUTHENTICATION_EXTRACT_API_KEY=true

# Base de datos
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:postgres@localhost:5432/evolution_db

# Webhook
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_WEBHOOK_URL=http://localhost:3000/api/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
WEBHOOK_GLOBAL_EVENTS=messages.upsert,send.message
```

### 3. Iniciar Evolution API

```bash
npm run start:prod
# o para desarrollo
npm run dev
```

## Crear una Instancia de WhatsApp

Una vez que Evolution API esté corriendo:

### 1. Crear instancia (QR Code)

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: your-super-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "mi-whatsapp",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

Respuesta esperada:
```json
{
  "instance": {
    "instanceName": "mi-whatsapp",
    "status": "close"
  },
  "qrcode": {
    "pairingCode": "KJ4RF8XN",
    "code": "2@dr...QR...",
    "base64": "data:image/png;base64,..."
  }
}
```

### 2. Conectar con WhatsApp

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** > **Aparatos conectados**
3. Toca **Conectar un aparato**
4. Ingresa el código de emparejamiento (pairingCode)

### 3. Verificar estado de la instancia

```bash
curl -X GET http://localhost:8080/instance/connectionState/mi-whatsapp \
  -H "apikey: your-super-secret-api-key"
```

Respuesta cuando está conectado:
```json
{
  "instance": "mi-whatsapp",
  "state": "open"
}
```

## Configurar Webhook para tu Instancia

```bash
curl -X POST http://localhost:8080/webhook/set/mi-whatsapp \
  -H "apikey: your-super-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3000/api/webhook",
    "events": [
      "messages.upsert",
      "send.message"
    ],
    "webhook_by_events": true
  }'
```

## Probar el Webhook

Envía un mensaje a tu WhatsApp conectado y verifica que llegue al dashboard.

También puedes enviar un mensaje de prueba:

```bash
curl -X POST http://localhost:8080/message/sendText/mi-whatsapp \
  -H "apikey: your-super-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "521234567890",
    "text": "Mensaje de prueba desde Evolution API"
  }'
```

## Comandos Útiles

### Listar todas las instancias

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: your-super-secret-api-key"
```

### Desconectar una instancia

```bash
curl -X DELETE http://localhost:8080/instance/logout/mi-whatsapp \
  -H "apikey: your-super-secret-api-key"
```

### Eliminar una instancia

```bash
curl -X DELETE http://localhost:8080/instance/delete/mi-whatsapp \
  -H "apikey: your-super-secret-api-key"
```

## Solución de Problemas

### Error: "Instance not found"

Verifica que la instancia esté creada:
```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: your-super-secret-api-key"
```

### Error: "Connection refused"

Asegúrate de que Evolution API esté corriendo:
```bash
docker ps | grep evolution
# o
curl http://localhost:8080
```

### El webhook no recibe mensajes

1. Verifica que el webhook esté configurado correctamente
2. Revisa los logs de Evolution API: `docker logs evolution-api`
3. Verifica que el dashboard esté corriendo en el puerto 3000

### QR Code expirado

El QR code expira después de unos segundos. Necesitas generar uno nuevo:

```bash
curl -X DELETE http://localhost:8080/instance/logout/mi-whatsapp \
  -H "apikey: your-super-secret-api-key"

curl -X POST http://localhost:8080/instance/connect/mi-whatsapp \
  -H "apikey: your-super-secret-api-key"
```

## Próximos Pasos

Una vez que tengas Evolution API configurado y una instancia conectada:

1. Regístrate en el dashboard (o pide al admin que cree tu usuario)
2. En tu perfil, configura tus credenciales de Evolution API
3. Agrega el nombre de tu instancia
4. ¡Los mensajes empezarán a llegar al dashboard!
