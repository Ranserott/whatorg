import type {
  EvolutionWebhook,
  WebhookData,
  CreateMessageData,
  MessageType,
  Direction
} from '@/types/evolution-api'

export function isMessagesUpsertEvent(event: string): boolean {
  return event === 'messages.upsert' || event === 'MESSAGES_UPSERT'
}

export function getMessageType(data: WebhookData): MessageType {
  const message = data.message

  if (!message) return 'TEXT'

  if (message.imageMessage) return 'IMAGE'
  if (message.videoMessage) return 'VIDEO'
  if (message.audioMessage) return 'AUDIO'
  if (message.documentMessage) return 'DOCUMENT'
  if (message.stickerMessage) return 'STICKER'
  if (message.locationMessage) return 'LOCATION'
  if (message.contactMessage) return 'CONTACT'

  return 'TEXT'
}

export function getMessageContent(data: WebhookData): string | null {
  const message = data.message

  if (!message) return null

  // Direct conversation
  if (message.conversation) return message.conversation

  // Extended text
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text

  // Media with captions
  if (message.imageMessage?.caption) return `[IMAGE] ${message.imageMessage.caption}`
  if (message.videoMessage?.caption) return `[VIDEO] ${message.videoMessage.caption}`
  if (message.documentMessage) {
    const title = message.documentMessage.title || 'Document'
    const caption = message.documentMessage.caption || ''
    return `[DOCUMENT] ${title}${caption ? ': ' + caption : ''}`
  }

  // Other media types
  if (message.audioMessage) return '[AUDIO]'
  if (message.stickerMessage) return '[STICKER]'
  if (message.locationMessage) {
    const { name, degreesLatitude, degreesLongitude } = message.locationMessage
    return `[LOCATION] ${name} (${degreesLatitude}, ${degreesLongitude})`
  }
  if (message.contactMessage) {
    return `[CONTACT] ${message.contactMessage.displayName}`
  }

  return null
}

export function getSenderNumber(data: WebhookData): string {
  return data.key?.remoteJid || 'unknown'
}

export function getDirection(data: WebhookData): Direction {
  return data.key?.fromMe ? 'OUTGOING' : 'INCOMING'
}

export function getInstanceName(instance: string): string {
  return instance || 'default'
}

export function getSenderName(data: WebhookData): string | null {
  // For outgoing messages, use the instance or system
  if (data.key?.fromMe) {
    return null // Will be displayed as "You" in UI
  }

  return data.pushName || null
}

export function extractMessageData(
  webhook: EvolutionWebhook
): CreateMessageData | null {
  const { event, data, instance } = webhook

  if (!isMessagesUpsertEvent(event)) {
    return null
  }

  if (!data.key?.id) {
    return null
  }

  const whatsappId = data.key.id
  const senderNumber = getSenderNumber(data)
  const instanceName = getInstanceName(instance)
  const type = getMessageType(data)
  const direction = getDirection(data)
  const content = getMessageContent(data)
  const senderName = getSenderName(data)

  return {
    whatsappId,
    content,
    senderName,
    senderNumber,
    instanceName,
    type,
    direction
  }
}

export function sanitizePhoneNumber(phone: string): string {
  // Remove @s.whatsapp.net suffix if present
  let sanitized = phone.replace(/@s\.whatsapp\.net$/, '')
  // Remove @g.us suffix (group chats) if present
  sanitized = sanitized.replace(/@g\.us$/, '')
  // Remove + prefix if present
  sanitized = sanitized.replace(/^\+/, '')
  return sanitized
}

export function formatDisplayName(name: string | null, phone: string): string {
  if (name) return name
  return sanitizePhoneNumber(phone)
}
