// Evolution API Webhook Types
export interface EvolutionWebhook {
  event: string
  data: WebhookData
  instance: string
  server_url?: string
}

export interface WebhookData {
  key?: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
    imageMessage?: {
      caption: string
      url: string
    }
    videoMessage?: {
      caption: string
      url: string
    }
    audioMessage?: {
      url: string
    }
    documentMessage?: {
      caption: string
      url: string
      title?: string
    }
    stickerMessage?: {
      url: string
    }
    locationMessage?: {
      degreesLatitude: number
      degreesLongitude: number
      name: string
    }
    contactMessage?: {
      displayName: string
    }
  }
  pushName?: string
  messageType?: string
  messageTimestamp?: number
}

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'STICKER'
  | 'LOCATION'
  | 'CONTACT'

export type Direction = 'INCOMING' | 'OUTGOING'

// Message creation type
export interface CreateMessageData {
  whatsappId: string
  content: string | null
  senderName: string | null
  senderNumber: string
  instanceName: string
  type: MessageType
  direction: Direction
}

// Dashboard response types
export interface DashboardMessage {
  id: string
  whatsappId: string
  content: string | null
  senderName: string | null
  senderNumber: string
  instanceName: string
  type: MessageType
  direction: Direction
  createdAt: Date
}

export interface ContactInfo {
  senderNumber: string
  senderName: string | null
  lastMessageAt: Date
  messageCount: number
}

export interface DateInfo {
  date: string
  messageCount: number
}
