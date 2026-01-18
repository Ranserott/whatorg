'use client'

import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, User } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

interface Contact {
  senderNumber: string
  senderName: string | null
  lastMessageAt: string
  messageCount: number
}

interface ChatSidebarProps {
  selectedDate: string
  selectedContact: string | null
  onContactSelect: (contact: string) => void
}

export function ChatSidebar({
  selectedDate,
  selectedContact,
  onContactSelect
}: ChatSidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchContacts = async (query?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ date: selectedDate })
      if (query) params.append('search', query)

      const response = await fetch(`/api/messages/contacts?${params}`)
      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [selectedDate])

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchContacts(searchQuery || undefined)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, selectedDate])

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
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Ayer'
    return format(date, 'dd/MM')
  }

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm border-r border-blue-100/50">
      {/* Search */}
      <div className="p-4 border-b border-blue-100/50 bg-white/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar contactos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/80 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            Cargando contactos...
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            No hay contactos
          </div>
        ) : (
          <div className="divide-y divide-blue-100/50">
            {contacts.map((contact) => (
              <button
                key={contact.senderNumber}
                onClick={() => onContactSelect(contact.senderNumber)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-blue-50/50 transition-all duration-200 text-left ${
                  selectedContact === contact.senderNumber ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {getInitials(contact.senderName, contact.senderNumber)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium truncate ${selectedContact === contact.senderNumber ? 'text-blue-700' : 'text-slate-800'}`}>
                      {contact.senderName || contact.senderNumber}
                    </p>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatTime(contact.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-500 truncate">
                      {contact.senderNumber}
                    </p>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                      {contact.messageCount}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
