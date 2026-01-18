'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  RefreshCw,
  Smartphone,
  Shield,
  Settings,
  LogOut,
  AlertCircle,
  CheckCircle2,
  QrCode
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface UserData {
  id: string
  username: string
  name: string | null
  instanceName: string | null
  instanceStatus: string | null
  instanceQr: string | null
  pairingCode: string | null
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchProfile()
    // Auto-refresh every 5 seconds to check instance status
    const interval = setInterval(refreshProfile, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/instance', {
        method: 'PUT'
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to refresh instance:', error)
    }
  }

  const handleCreateInstance = async () => {
    const instanceName = `${session?.user?.username}-${Date.now()}`
    try {
      setRefreshing(true)
      const response = await fetch('/api/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create instance')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (error: any) {
      console.error('Failed to create instance:', error)
      alert('Error al crear instancia: ' + error.message)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar tu WhatsApp?')) return

    try {
      setRefreshing(true)
      const response = await fetch('/api/instance', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      setUser(null)
    } catch (error: any) {
      console.error('Failed to disconnect:', error)
      alert('Error al desconectar: ' + error.message)
    } finally {
      setRefreshing(false)
    }
  }

  const getInstanceStatusBadge = () => {
    if (!user?.instanceStatus) return null

    const status = user.instanceStatus.toLowerCase()
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Conectado
        </Badge>
      case 'close':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
          <AlertCircle className="h-3 w-3" />
          Desconectado
        </Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          {status}
        </Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
      </div>

      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mi WhatsApp</h1>
              <p className="text-slate-600">Conecta tu WhatsApp para ver mensajes</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-12 text-center text-slate-500">
              Cargando...
            </CardContent>
          </Card>
        ) : (
          <>
            {/* User Info Card */}
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-800">Tu Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {session?.user?.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{session?.user?.name || 'Sin configurar'}</p>
                    <p className="text-sm text-slate-500">@{session?.user?.username}</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    {session?.user?.role === 'ADMIN' ? (
                      <><Shield className="h-3 w-3 mr-1" />Admin</>
                    ) : (
                      'Usuario'
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Instance Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  Estado de WhatsApp
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Conecta tu WhatsApp para ver los mensajes en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!user?.instanceName ? (
                  // No instance - show create button
                  <div className="text-center py-8">
                    <Smartphone className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">
                      No tienes WhatsApp conectado
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                      Crea una instancia para conectar tu WhatsApp y empezar a recibir mensajes
                    </p>
                    <Button
                      onClick={handleCreateInstance}
                      disabled={refreshing}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transition-all duration-200"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      {refreshing ? 'Creando...' : 'Crear WhatsApp'}
                    </Button>
                  </div>
                ) : (
                  // Has instance - show QR and status
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Estado:</span>
                      <div className="flex items-center gap-2">
                        {getInstanceStatusBadge()}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={refreshProfile}
                          disabled={refreshing}
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          title="Actualizar estado"
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Instance name */}
                    <div className="text-sm text-slate-600">
                      Instancia: <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {user.instanceName}
                      </span>
                    </div>

                    {/* QR Code */}
                    {user.instanceStatus !== 'open' && user.instanceQr && (
                      <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-800 mb-4">
                              Escanea este QR desde tu WhatsApp
                            </p>
                            <div className="bg-white p-4 rounded-lg inline-block border-2 border-slate-200">
                              {user.instanceQr && (
                                <img
                                  src={user.instanceQr}
                                  alt="QR Code"
                                  className="w-48 h-48"
                                />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              1. Abre WhatsApp en tu teléfono
                            </p>
                            <p className="text-xs text-slate-500">
                              2. Toca Configuración → Aparatos conectados
                            </p>
                            <p className="text-xs text-slate-500">
                              3. Toca "Conectar un aparato"
                            </p>
                            <p className="text-xs text-slate-500">
                              4. Escanea el código o ingresa el pairing code
                            </p>
                            {user.pairingCode && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-xs text-blue-800">
                                  Código: <code className="font-mono font-bold">{user.pairingCode}</code>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Connected state */}
                    {user.instanceStatus === 'open' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-green-800 mb-1">
                          ¡Conectado!
                        </h3>
                        <p className="text-sm text-green-700">
                          Tu WhatsApp está conectado y recibiendo mensajes
                        </p>
                      </div>
                    )}

                    {/* Disconnect button */}
                    <Button
                      onClick={handleDisconnect}
                      disabled={refreshing}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {refreshing ? 'Desconectando...' : 'Desconectar WhatsApp'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="mt-6 flex gap-4 justify-center">
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 shadow-md transition-all duration-200">
                  <Shield className="h-4 w-4" />
                  Panel de Administración
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
