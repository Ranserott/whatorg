'use client'

import { useEffect, useState, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Phone, Video, MoreVertical, Image as ImageIcon, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { formatPhoneNumber } from '@/lib/utils'
import type { MessageType, Direction } from '@/types/evolution-api'

interface Message {
  id: string
  whatsappId: string
  content: string | null
  senderName: string | null
  senderNumber: string
  type: MessageType
  direction: Direction
  mediaUrl: string | null
  createdAt: string
}

interface ChatViewProps {
  contact: string
  contactName: string | null
  initialStatus?: string | null
  onStatusChange?: (status: string) => void
  selectedDate: string
}

export function ChatView({ contact, contactName, initialStatus, onStatusChange, selectedDate }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [status, setStatus] = useState<string>(initialStatus || 'OPEN')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStatus(initialStatus || 'OPEN')
  }, [initialStatus])

  const updateStatus = async (newStatus: string) => {
    // If clicking the same status, toggle back to OPEN
    const statusToSet = status === newStatus ? 'OPEN' : newStatus
    
    try {
      setUpdatingStatus(true)
      const response = await fetch('/api/contacts/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: contact, status: statusToSet })
      })
      
      if (response.ok) {
        setStatus(statusToSet)
        onStatusChange?.(statusToSet)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        date: selectedDate,
        contact: contact
      })

      const response = await fetch(`/api/messages?${params}`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [contact, selectedDate])

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getInitials = (name: string | null, phone: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    // If no name, use phone number digits
    const digits = phone.replace(/\D/g, '')
    return digits.slice(-2)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'HH:mm')
  }

  const formatDateSeparator = (dateStr: string, prevDateStr?: string) => {
    const date = new Date(dateStr)
    const prevDate = prevDateStr ? new Date(prevDateStr) : null

    // Check if we need a date separator (different day)
    if (prevDate) {
      const prevDay = format(prevDate, 'yyyy-MM-dd')
      const currDay = format(date, 'yyyy-MM-dd')
      if (prevDay === currDay) return null
    }

    if (isToday(date)) return 'Hoy'
    if (isYesterday(date)) return 'Ayer'
    return format(date, 'dd MMM yyyy')
  }

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'IMAGE': return '📷'
      case 'VIDEO': return '🎥'
      case 'AUDIO': return '🎤'
      case 'DOCUMENT': return '📄'
      case 'STICKER': return '😀'
      case 'LOCATION': return '📍'
      case 'CONTACT': return '👤'
      default: return null
    }
  }

  const renderMediaContent = (msg: Message) => {
    if (!msg.mediaUrl) return null

    switch (msg.type) {
      case 'IMAGE':
        return (
          <div className="mt-2 rounded-lg overflow-hidden">
            <img
              src={msg.mediaUrl}
              alt="Imagen"
              className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(msg.mediaUrl!, '_blank')}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const parent = e.currentTarget.parentElement
                if (parent) {
                  const div = document.createElement('div')
                  div.className = 'p-8 text-center bg-slate-100 text-slate-400 text-sm'
                  div.textContent = 'Imagen no disponible'
                  parent.appendChild(div)
                }
              }}
            />
          </div>
        )

      case 'VIDEO':
        return (
          <div className="mt-2 rounded-lg overflow-hidden">
            <video
              src={msg.mediaUrl}
              controls
              className="max-w-full h-auto"
            />
          </div>
        )

      case 'AUDIO':
        return (
          <div className="mt-2">
            <audio
              src={msg.mediaUrl}
              controls
              className="w-full"
            />
          </div>
        )

      case 'DOCUMENT':
        return (
          <div className="mt-2">
            <a
              href={msg.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <span className="text-lg">📄</span>
              <span className="text-sm underline">Ver documento</span>
            </a>
          </div>
        )

      case 'STICKER':
        return (
          <div className="mt-2 rounded-lg overflow-hidden max-w-[150px]">
            <img
              src={msg.mediaUrl}
              alt="Sticker"
              className="w-full h-auto"
            />
          </div>
        )

      default:
        return null
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return

    try {
      setSending(true)

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: contact,
          text: messageText
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const data = await response.json()

      // Add the new message to the list
      setMessages(prev => [...prev, data.message])

      // Clear the input
      setMessageText('')

      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Error al enviar mensaje: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-blue-100">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              {getInitials(contactName, contact)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-800">{contactName || formatPhoneNumber(contact)}</p>
            <p className="text-sm text-slate-500">{formatPhoneNumber(contact)}</p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant={status === 'SOLD' ? 'default' : 'outline'}
            size="sm"
            className={status === 'SOLD' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-green-600 border-green-200 hover:bg-green-50'}
            onClick={() => updateStatus('SOLD')}
            disabled={updatingStatus}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Vendido
          </Button>
          <Button 
            variant={status === 'DISMISSED' ? 'default' : 'outline'}
            size="sm"
            className={status === 'DISMISSED' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-red-600 border-red-200 hover:bg-red-50'}
            onClick={() => updateStatus('DISMISSED')}
            disabled={updatingStatus}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Anulado
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            No hay mensajes para esta fecha
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1]
              const dateSeparator = formatDateSeparator(msg.createdAt, prevMsg?.createdAt)
              const isOutgoing = msg.direction === 'OUTGOING'

              return (
                <div key={msg.id}>
                  {/* Date Separator */}
                  {dateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-xs text-slate-500 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-slate-200">
                        {dateSeparator}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOutgoing && (
                      <Avatar className="h-8 w-8 mr-2 mt-1 ring-2 ring-blue-100">
                        <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white text-xs">
                          {getInitials(msg.senderName, msg.senderNumber)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] px-4 py-2.5 shadow-sm ${
                        isOutgoing
                          ? 'message-bubble-outgoing text-white'
                          : 'message-bubble-incoming text-slate-800'
                      }`}
                    >
                      {/* Type Badge for non-text messages */}
                      {msg.type !== 'TEXT' && !msg.mediaUrl && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">
                            {getMessageTypeIcon(msg.type)}
                          </span>
                          <Badge variant="outline" className="text-xs h-5 bg-white/20 border-white/30">
                            {msg.type}
                          </Badge>
                        </div>
                      )}

                      {/* Media Content */}
                      {renderMediaContent(msg)}

                      {/* Content (text caption) */}
                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {msg.content}
                        </p>
                      )}

                      {/* Timestamp */}
                      <p
                        className={`text-xs mt-1 ${
                          isOutgoing
                            ? 'text-white/80'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Escribe un mensaje..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !messageText.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
