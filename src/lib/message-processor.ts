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
  if (message.imageMessage?.caption) return message.imageMessage.caption
  if (message.videoMessage?.caption) return message.videoMessage.caption
  if (message.documentMessage?.caption) return message.documentMessage.caption

  // Other media types - return null so we only show the media
  if (message.audioMessage) return null
  if (message.stickerMessage) return null
  if (message.locationMessage) {
    const { name, degreesLatitude, degreesLongitude } = message.locationMessage
    return `[LOCATION] ${name} (${degreesLatitude}, ${degreesLongitude})`
  }
  if (message.contactMessage) {
    return `[CONTACT] ${message.contactMessage.displayName}`
  }

  return null
}

export function getMediaUrl(data: WebhookData): string | null {
  const message = data.message

  if (!message) return null

  // Media URLs from Evolution API
  // Check for Image
  if (message.imageMessage) {
    if (message.imageMessage.url) return message.imageMessage.url
    
    // Fallback to thumbnail or base64 if available (Evolution API v2)
    const imgMsg = message.imageMessage as any
    if (imgMsg.base64) {
      return `data:image/jpeg;base64,${imgMsg.base64}`
    }
    if (imgMsg.jpegThumbnail) {
      return `data:image/jpeg;base64,${imgMsg.jpegThumbnail}`
    }
  }

  if (message.audioMessage?.url) return message.audioMessage.url
  if (message.videoMessage?.url) return message.videoMessage.url
  if (message.documentMessage?.url) return message.documentMessage.url
  if (message.stickerMessage?.url) return message.stickerMessage.url

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
  const mediaUrl = getMediaUrl(data)

  // Use message timestamp from webhook (Unix timestamp)
  // Evolution API v2 sends timestamp in milliseconds, detect format automatically
  let createdAt: Date | undefined
  if (data.messageTimestamp) {
    // If timestamp is in seconds (< 10000000000), convert to milliseconds
    // If timestamp is already in milliseconds, use directly
    const timestamp = data.messageTimestamp < 10000000000
      ? data.messageTimestamp * 1000
      : data.messageTimestamp
    createdAt = new Date(timestamp)
    console.log('[MessageProcessor] messageTimestamp:', data.messageTimestamp, '-> converted:', timestamp, '-> date:', createdAt.toISOString())
  }

  return {
    whatsappId,
    content,
    senderName,
    senderNumber,
    instanceName,
    type,
    direction,
    mediaUrl,
    createdAt
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
