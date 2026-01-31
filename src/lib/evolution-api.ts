// Evolution API Integration Service
// This service handles communication with Evolution API v2

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://what.ranserot.xyz'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

export interface EvolutionInstance {
  instanceName: string
  status: 'open' | 'close' | 'connecting' | 'disconnecting'
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string
    status: string
  }
  qrcode?: {
    base64: string
    code: string
    pairingCode: string | null
  }
}

export interface ConnectionStateResponse {
  instance: string
  state: string
}

export interface WebhookResponse {
  message: string
  status?: number
}

export class EvolutionApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'EvolutionApiError'
  }
}

/**
 * Create a new instance in Evolution API
 */
export async function createInstance(instanceName: string): Promise<CreateInstanceResponse> {
  const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY!
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new EvolutionApiError(`Failed to create instance: ${error}`, response.status)
  }

  return response.json()
}

/**
 * Get the QR code for an instance
 */
export async function fetchInstanceQr(instanceName: string): Promise<{ base64: string; code: string }> {
  const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: {
      'apikey': EVOLUTION_API_KEY!
    }
  })

  if (!response.ok) {
    throw new EvolutionApiError(`Failed to fetch QR: ${response.status}`, response.status)
  }

  const data = await response.json()
  return {
    base64: data.base64,
    code: data.code
  }
}

/**
 * Check the connection state of an instance
 */
export async function getConnectionState(instanceName: string): Promise<ConnectionStateResponse> {
  const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
    method: 'GET',
    headers: {
      'apikey': EVOLUTION_API_KEY!
    }
  })

  if (!response.ok) {
    throw new EvolutionApiError(`Failed to get connection state: ${response.status}`, response.status)
  }

  return response.json()
}

/**
 * Set webhook for an instance
 * Format: webhook object must be nested inside the request body
 */
export async function setWebhook(instanceName: string, webhookUrl: string): Promise<WebhookResponse> {
  const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY!
    },
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhook_by_events: false,
        events: ['MESSAGES_UPSERT']
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new EvolutionApiError(`Failed to set webhook: ${response.status} - ${errorText}`, response.status)
  }

  return response.json()
}

/**
 * Logout an instance
 */
export async function logoutInstance(instanceName: string): Promise<void> {
  const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
    method: 'DELETE',
    headers: {
      'apikey': EVOLUTION_API_KEY!
    }
  })

  if (!response.ok) {
    throw new EvolutionApiError(`Failed to logout instance: ${response.status}`, response.status)
  }
}

/**
 * Delete an instance
 */
export async function deleteInstance(instanceName: string): Promise<void> {
  const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers: {
      'apikey': EVOLUTION_API_KEY!
    }
  })

  if (!response.ok) {
    throw new EvolutionApiError(`Failed to delete instance: ${response.status}`, response.status)
  }
}

/**
 * Fetch all instances
 */
export async function fetchInstances(): Promise<any> {
  const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
    method: 'GET',
    headers: {
      'apikey': EVOLUTION_API_KEY!
    }
  })

  if (!response.ok) {
    throw new EvolutionApiError(`Failed to fetch instances: ${response.status}`, response.status)
  }

  return response.json()
}

export interface SendTextMessageResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: {
    extendedTextMessage?: {
      text: string
    }
    conversation?: string
  }
  messageTimestamp: string
  status: string
}

export interface SendTextMessageOptions {
  number: string
  text: string
  delay?: number
  linkPreview?: boolean
}

/**
 * Send a text message through Evolution API v2
 * POST /message/sendText/{instance}
 */
export async function sendTextMessage(
  instanceName: string,
  options: SendTextMessageOptions
): Promise<SendTextMessageResponse> {
  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY!
    },
    body: JSON.stringify({
      number: options.number,
      text: options.text,
      delay: options.delay || 0,
      linkPreview: options.linkPreview !== undefined ? options.linkPreview : false
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new EvolutionApiError(`Failed to send message: ${response.status} - ${errorText}`, response.status)
  }

  return response.json()
}
