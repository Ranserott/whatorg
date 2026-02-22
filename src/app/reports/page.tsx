'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, BarChart3, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DateSelector } from '@/components/date-selector'
import { formatInTimeZone } from 'date-fns-tz'

interface DailyStats {
  incomingMessages: number
  outgoingMessages: number
  sold: number
  dismissed: number
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)
  // Always use Chile timezone for date initialization
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    return formatInTimeZone(now, 'America/Santiago', 'yyyy-MM-dd')
  })

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ date: selectedDate })
      const response = await fetch(`/api/reports/daily?${params}`)
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch daily stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [selectedDate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-600 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-blue-700">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Reportes y Métricas</h1>
                <p className="text-xs text-blue-500">Análisis de rendimiento</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Cargando estadísticas...
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">
                    Mensajes Entrantes
                  </CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{stats.incomingMessages}</div>
                  <p className="text-xs text-blue-500 mt-1">
                    Recibidos en la fecha seleccionada
                  </p>
                </CardContent>
              </Card>

              <Card className="border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-indigo-600">
                    Mensajes Contestados
                  </CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-700">{stats.outgoingMessages}</div>
                  <p className="text-xs text-indigo-500 mt-1">
                    Enviados en la fecha seleccionada
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">
                    Ventas Cerradas
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{stats.sold}</div>
                  <p className="text-xs text-green-500 mt-1">
                    Contactos marcados como vendidos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">
                    Contactos Anulados
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{stats.dismissed}</div>
                  <p className="text-xs text-red-500 mt-1">
                    Contactos descartados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Sections (Placeholder for future features) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-700">Resumen de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Gráfico de actividad por hora (Próximamente)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-700">Rendimiento de Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Gráfico de conversión (Próximamente)
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-500 py-12">
            No se pudieron cargar los datos. Por favor intente nuevamente.
          </div>
        )}
      </main>
    </div>
  )
}
