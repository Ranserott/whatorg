'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatView } from '@/components/chat-view'
import { DateSelector } from '@/components/date-selector'
import { SignOutButton } from '@/components/sign-out-button'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, User, Shield, Settings, LogOut } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null)

  // Get current date in Chile timezone on mount
  useEffect(() => {
    const now = new Date()
    // Format in Chile timezone
    const chileDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }))
    setSelectedDate(format(chileDate, 'yyyy-MM-dd'))
  }, [])

  const handleContactSelect = async (contactNumber: string) => {
    setSelectedContact(contactNumber)

    // Fetch contact name from the contacts list
    try {
      const params = new URLSearchParams({ date: selectedDate, search: contactNumber })
      const response = await fetch(`/api/messages/contacts?${params}`)
      const data = await response.json()
      const contact = data.contacts?.find((c: any) => c.senderNumber === contactNumber)
      setSelectedContactName(contact?.senderName || null)
    } catch (error) {
      console.error('Failed to fetch contact name:', error)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with Gradient */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">WhatsApp Audit</h1>
              <p className="text-xs text-blue-100">Sistema de Auditoría</p>
            </div>
          </div>
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date)
              setSelectedContact(null)
              setSelectedContactName(null)
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* User Info */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {session?.user?.name || session?.user?.email}
              </p>
              <div className="flex items-center justify-end gap-1">
                {session?.user?.role === 'ADMIN' ? (
                  <Badge className="text-xs bg-white/20 text-white hover:bg-white/30 border-white/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-white/20 text-white hover:bg-white/30 border-white/30">
                    <User className="h-3 w-3 mr-1" />
                    Usuario
                  </Badge>
                )}
              </div>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-white/30">
              <AvatarFallback className="bg-gradient-to-br from-white to-blue-100 text-blue-600">
                {getInitials(session?.user?.name || null, session?.user?.email || '')}
              </AvatarFallback>
            </Avatar>

            {/* Profile Button */}
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            {/* Admin Link */}
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <div className="w-px h-6 bg-white/20" />

            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <ChatSidebar
            selectedDate={selectedDate}
            selectedContact={selectedContact}
            onContactSelect={handleContactSelect}
          />
        </aside>

        {/* Chat View */}
        <main className="flex-1">
          {selectedContact ? (
            <ChatView
              contact={selectedContact}
              contactName={selectedContactName}
              selectedDate={selectedDate}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center animate-fade-in">
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Bienvenido, {session?.user?.name || session?.user?.email}
                </h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Selecciona un contacto del sidebar para ver los mensajes de WhatsApp
                </p>
                <div className="flex gap-3 justify-center text-sm">
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 hover:shadow-lg"
                  >
                    <Settings className="h-4 w-4" />
                    Configurar Evolution API
                  </Link>
                  {session?.user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg"
                    >
                      <Shield className="h-4 w-4" />
                      Panel de Administración
                    </Link>
                  )}
                </div>

                {/* Info Card */}
                <div className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100 max-w-md mx-auto">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Tu Evolution API:</strong>
                  </p>
                  <p className="text-xs text-slate-500 font-mono bg-white/80 rounded p-2">
                    https://what.ranserot.xyz
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
