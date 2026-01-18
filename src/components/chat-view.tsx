'use client'

import { useEffect, useState, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format, isToday, isYesterday } from 'date-fns'
import type { MessageType, Direction } from '@/types/evolution-api'

interface Message {
  id: string
  whatsappId: string
  content: string | null
  senderName: string | null
  senderNumber: string
  type: MessageType
  direction: Direction
  createdAt: string
}

interface ChatViewProps {
  contact: string
  contactName: string | null
  selectedDate: string
}

export function ChatView({ contact, contactName, selectedDate }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    return phone.slice(0, 2)
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <Avatar className="h-10 w-10 ring-2 ring-blue-100">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            {getInitials(contactName, contact)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-slate-800">{contactName || contact}</p>
          <p className="text-sm text-slate-500">{contact}</p>
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
                      {msg.type !== 'TEXT' && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">
                            {getMessageTypeIcon(msg.type)}
                          </span>
                          <Badge variant="outline" className="text-xs h-5 bg-white/20 border-white/30">
                            {msg.type}
                          </Badge>
                        </div>
                      )}

                      {/* Content */}
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
    </div>
  )
}
